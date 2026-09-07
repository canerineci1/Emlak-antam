import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Header } from '../components/Header';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { generateRealEstateSummary } from '../services/voiceAiService';
import { getVoiceCrmRecords, saveVoiceCrmRecord, deleteVoiceCrmRecord, shareCrmReportViaWhatsApp, VoiceCrmRecord } from '../services/crmService';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
export const VoiceMemoScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'RECORD' | 'CRM_LIST'>('RECORD');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [crmRecords, setCrmRecords] = useState<VoiceCrmRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<VoiceCrmRecord | null>(null);

  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    loadCrmRecords();
  }, []);

  const loadCrmRecords = async () => {
    const records = await getVoiceCrmRecords();
    setCrmRecords(records);
  };

  // WHISPER AI SES KAYIT VE TRANSKRİP MOTORU (HTML5 / WEBAUDIO)
  const whisperBridgeHtml = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Whisper Bridge</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          overflow: hidden;
          padding: 8px;
        }
        .mic-btn {
          width: 76px;
          height: 76px;
          border-radius: 38px;
          background: #2563EB;
          border: none;
          outline: none;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
          transition: all 0.2s ease;
          -webkit-tap-highlight-color: transparent;
        }
        .mic-btn.recording {
          background: #EF4444;
          animation: pulse 1.2s infinite;
        }
        .mic-btn.busy {
          background: #F59E0B;
          pointer-events: none;
        }
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        .status-title {
          margin-top: 10px;
          font-size: 15px;
          font-weight: 800;
          color: #0F172A;
          text-align: center;
        }
        .status-sub {
          font-size: 11px;
          color: #64748B;
          margin-top: 3px;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <button id="micBtn" class="mic-btn" onclick="handleToggleRecord()">
        <svg id="micIcon" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="22"></line>
        </svg>
      </button>

      <div id="statusTitle" class="status-title">Konuşmak İçin Mikrofona Dokunun</div>
      <div id="statusSub" class="status-sub">Sesiniz Whisper AI ile doğrudan metne dökülür</div>

      <script>
        const GROQ_KEY = '${GROQ_API_KEY}';
        let isRecording = false;
        let audioContext = null;
        let mediaStream = null;
        let scriptProcessor = null;
        let audioChunks = [];
        let timerInterval = null;
        let seconds = 0;

        function updateTimer() {
          seconds++;
          const m = Math.floor(seconds / 60);
          const s = seconds % 60;
          const timeStr = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
          document.getElementById('statusTitle').innerText = '🔴 Dinleniyor... (' + timeStr + ')';
        }

        async function handleToggleRecord() {
          const btn = document.getElementById('micBtn');
          const title = document.getElementById('statusTitle');
          const sub = document.getElementById('statusSub');

          if (!isRecording) {
            // BAŞLAT
            try {
              audioChunks = [];
              seconds = 0;
              mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
              
              const source = audioContext.createMediaStreamSource(mediaStream);
              scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

              scriptProcessor.onaudioprocess = function(e) {
                if (!isRecording) return;
                const inputData = e.inputBuffer.getChannelData(0);
                audioChunks.push(new Float32Array(inputData));
              };

              source.connect(scriptProcessor);
              scriptProcessor.connect(audioContext.destination);

              isRecording = true;
              btn.classList.add('recording');
              title.innerText = '🔴 Dinleniyor... (00:00)';
              title.style.color = '#EF4444';
              sub.innerText = 'Bitirmek için butona tekrar dokunun';

              timerInterval = setInterval(updateTimer, 1000);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'RECORDING_STARTED' }));
            } catch (err) {
              console.warn('getUserMedia error', err);
              title.innerText = 'Mikrofon Erişimi Bekleniyor';
              sub.innerText = 'Lütfen gelen ekranda mikrofon iznini onaylayın';
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error: err.name + ': ' + err.message }));
            }
          } else {
            // DURDUR VE WHISPER AI'A GÖNDER
            isRecording = false;
            clearInterval(timerInterval);
            btn.classList.remove('recording');
            btn.classList.add('busy');
            title.innerText = '⚡ Whisper AI Sesi Çözüyor...';
            title.style.color = '#2563EB';
            sub.innerText = 'Lütfen bekleyin (yaklaşık 0.5 sn)...';

            window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'PROCESSING' }));

            if (scriptProcessor) scriptProcessor.disconnect();
            if (mediaStream) mediaStream.getTracks().forEach(function(t) { t.stop(); });
            if (audioContext) audioContext.close();

            // PCM verisini 16kHz WAV formatına çevir
            const wavBlob = exportWav(audioChunks, 16000);

            // Groq Whisper Large v3 API'sine POST et
            try {
              const formData = new FormData();
              formData.append('file', wavBlob, 'speech.wav');
              formData.append('model', 'whisper-large-v3');
              formData.append('language', 'tr');

              const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + GROQ_KEY
                },
                body: formData
              });

              const result = await response.json();
              btn.classList.remove('busy');

              if (result && result.text) {
                title.innerText = 'Ses Başarıyla Çözümlendi ✓';
                title.style.color = '#059669';
                sub.innerText = 'Rapor aşağıya çıkarıldı';
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TRANSCRIPT_SUCCESS', text: result.text.trim() }));
              } else {
                title.innerText = 'Ses Anlaşılamadı';
                title.style.color = '#0F172A';
                sub.innerText = 'Lütfen tekrar konuşmayı deneyin';
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'TRANSCRIPT_EMPTY' }));
              }
            } catch (apiErr) {
              btn.classList.remove('busy');
              title.innerText = 'Bağlantı Hatası';
              sub.innerText = 'Yeniden denemek için dokunun';
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ERROR', error: apiErr.message }));
            }
          }
        }

        // PCM TO 16-BIT MONO WAV ENCODER
        function exportWav(chunks, sampleRate) {
          let totalLength = 0;
          for (let i = 0; i < chunks.length; i++) {
            totalLength += chunks[i].length;
          }
          const mergedSamples = new Float32Array(totalLength);
          let offset = 0;
          for (let i = 0; i < chunks.length; i++) {
            mergedSamples.set(chunks[i], offset);
            offset += chunks[i].length;
          }

          const wavBuffer = new ArrayBuffer(44 + mergedSamples.length * 2);
          const view = new DataView(wavBuffer);

          writeString(view, 0, 'RIFF');
          view.setUint32(4, 36 + mergedSamples.length * 2, true);
          writeString(view, 8, 'WAVE');
          writeString(view, 12, 'fmt ');
          view.setUint32(16, 16, true);
          view.setUint16(20, 1, true);
          view.setUint16(22, 1, true);
          view.setUint32(24, sampleRate, true);
          view.setUint32(28, sampleRate * 2, true);
          view.setUint16(32, 2, true);
          view.setUint16(34, 16, true);
          writeString(view, 36, 'data');
          view.setUint32(40, mergedSamples.length * 2, true);

          let index = 44;
          for (let i = 0; i < mergedSamples.length; i++) {
            const s = Math.max(-1, Math.min(1, mergedSamples[i]));
            view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            index += 2;
          }

          return new Blob([wavBuffer], { type: 'audio/wav' });
        }

        function writeString(view, offset, string) {
          for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
          }
        }
      </script>
    </body>
    </html>
  `;

  // WebView'den Gelen Mesajlar
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'TRANSCRIPT_SUCCESS' && data.text) {
        setTranscript(data.text);
        const report = generateRealEstateSummary(data.text);
        setSummary(report);
      }
    } catch (e) {
      console.warn('Bridge parse error', e);
    }
  };

  // RAPORU CRM'E KAYDETME İŞLEMİ
  const handleSaveToCrm = async () => {
    if (!summary) {
      Alert.alert('Uyarı', 'Kaydedilecek bir rapor bulunmuyor. Lütfen önce sesli not alın veya özet çıkarın.');
      return;
    }

    const lower = transcript.toLowerCase();
    const isNeg = lower.includes('beğenmedi') || lower.includes('istemiyor') || lower.includes('olumsuz');
    const isPos = lower.includes('beğendi') || lower.includes('bayıldı') || lower.includes('almak istiyor');

    const sentiment = isNeg ? 'OLUMSUZ' : isPos ? 'OLUMLU' : 'KARARSIZ';
    const sentimentLabel = isNeg ? '❌ Olumsuz' : isPos ? '✅ Olumlu' : '🤔 Kararsız';

    const priceMatch = transcript.match(/(\d+([.,]\d+)?)\s*(milyon|bin|tl|TL)?/i);
    const financialNote = priceMatch && priceMatch[1] ? `${priceMatch[1]} ${priceMatch[3] || 'TL'}` : 'Fiyat itirazı yok';

    const newRecord = await saveVoiceCrmRecord({
      clientName: 'Görüşülen Müşteri',
      propertyTitle: lower.includes('villa') ? 'Villa Gösterimi' : lower.includes('arsa') ? 'Arsa İncelemesi' : 'Daire / Konut Gösterimi',
      sentiment,
      sentimentLabel,
      financialNote,
      rawTranscript: transcript,
      reportSummary: summary
    });

    await loadCrmRecords();

    Alert.alert(
      '🎉 CRM\'e Kaydedildi!',
      'Görüşme raporu başarıyla CRM Saha Kayıtlarına eklendi. Şimdi ne yapmak istersiniz?',
      [
        {
          text: 'Raporları Listele',
          onPress: () => setActiveTab('CRM_LIST')
        },
        {
          text: 'WhatsApp ile Gönder',
          onPress: () => shareCrmReportViaWhatsApp(newRecord)
        },
        { text: 'Tamam' }
      ]
    );
  };

  const handleDeleteRecord = async (id: string) => {
    Alert.alert('Kaydı Sil', 'Bu görüşme raporunu CRM kayıtlarından silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteVoiceCrmRecord(id);
          setCrmRecords(updated);
          if (selectedRecord?.id === id) {
            setSelectedRecord(null);
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header
        title="Sesli Not Asistanı"
        subtitle="Groq Whisper AI ve Saha CRM Raporları"
        badgeText="WHISPER AI"
        onBack={() => navigation.goBack()}
      />

      {/* ÜST SEKMELER (SES KAYDI | CRM KAYITLARI) */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'RECORD' && styles.tabButtonActive]}
          onPress={() => setActiveTab('RECORD')}
        >
          <Ionicons
            name="mic"
            size={16}
            color={activeTab === 'RECORD' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'RECORD' && styles.tabTextActive]}>
            Yeni Ses Kaydı
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.tabButton, activeTab === 'CRM_LIST' && styles.tabButtonActive]}
          onPress={() => setActiveTab('CRM_LIST')}
        >
          <Ionicons
            name="folder-open"
            size={16}
            color={activeTab === 'CRM_LIST' ? COLORS.primary : COLORS.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'CRM_LIST' && styles.tabTextActive]}>
            Kayıtlı CRM Raporları ({crmRecords.length})
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'RECORD' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          {/* AKTİF MOTOR BİLGİ ROZETİ */}
          <View style={styles.apiStatusBanner}>
            <Ionicons name="shield-checkmark" size={16} color={COLORS.accentDark} />
            <Text style={styles.apiStatusText}>
              Groq Whisper Large v3 Motoru Aktif (Sıfır Gecikme)
            </Text>
          </View>

          {/* 1. MİKROFON KARTI */}
          <View style={styles.micWebCard}>
            <WebView
              ref={webViewRef}
              originWhitelist={['*']}
              source={{ html: whisperBridgeHtml, baseUrl: 'https://emlakcantam.local' }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              mediaCapturePermissionGrantType="grant"
              style={styles.micWebView}
            />
          </View>

          {/* 2. SÖYLENEN / YAZILAN METİN KUTUSU */}
          <View style={styles.headerRow}>
            <Text style={styles.sectionLabel}>WHISPER AI İLE DÖKÜLEN METİN</Text>
            {transcript ? (
              <TouchableOpacity onPress={() => { setTranscript(''); setSummary(''); }}>
                <Text style={styles.clearText}>Temizle</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.textCard}>
            <TextInput
              style={styles.textInput}
              value={transcript}
              onChangeText={setTranscript}
              multiline
              placeholder="Mikrofona konuştuğunuzda söylediğiniz kelimeler buraya dökülür..."
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* 3. RAPORU ÇIKAR BUTONU */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.actionBtn}
            onPress={() => {
              if (!transcript.trim()) {
                Alert.alert('Uyarı', 'Lütfen kutuya notunuzu giriniz veya mikrofona konuşunuz.');
                return;
              }
              setSummary(generateRealEstateSummary(transcript.trim()));
            }}
          >
            <Ionicons name="sparkles" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Saha Raporunu Güncelle</Text>
          </TouchableOpacity>

          {/* 4. GENİŞLETİLMİŞ VE OKUNAKLI SAHA RAPORU */}
          {summary ? (
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionLabel}>GAYRİMENKUL SAHA VE GÖRÜŞME RAPORU</Text>

              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>{summary}</Text>
              </View>

              {/* CRM'E KAYDET BUTONU */}
              <TouchableOpacity
                activeOpacity={0.88}
                style={styles.saveBtn}
                onPress={handleSaveToCrm}
              >
                <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Raporu CRM'e Kaydet</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : (
        /* CRM RAPORLARI LİSTESİ */
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollPadding}>
          <Text style={styles.sectionLabel}>KAYITLI SAHA GÖRÜŞME RAPORLARI ({crmRecords.length})</Text>

          {crmRecords.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="folder-open-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Henüz Kayıtlı Rapor Yok</Text>
              <Text style={styles.emptySub}>
                Mikrofonla konuşup oluşturduğunuz raporları "Raporu CRM'e Kaydet" butonuna basarak buraya kaydedebilirsiniz.
              </Text>
            </View>
          ) : (
            crmRecords.map((item) => (
              <View key={item.id} style={styles.crmCard}>
                <View style={styles.crmCardHeader}>
                  <View style={styles.crmCardTitleBlock}>
                    <Text style={styles.crmPropertyTitle}>{item.propertyTitle}</Text>
                    <Text style={styles.crmDateText}>📅 {item.createdAt}</Text>
                  </View>

                  <View
                    style={[
                      styles.sentimentPill,
                      item.sentiment === 'OLUMSUZ' ? styles.pillRed : styles.pillGreen
                    ]}
                  >
                    <Text
                      style={[
                        styles.sentimentPillText,
                        item.sentiment === 'OLUMSUZ' ? styles.textRed : styles.textGreen
                      ]}
                    >
                      {item.sentimentLabel}
                    </Text>
                  </View>
                </View>

                {/* HAM KONUŞMA ALINTISI */}
                <Text style={styles.crmTranscript} numberOfLines={2}>
                  "{item.rawTranscript}"
                </Text>

                {/* DETAY AÇILMIŞSA TAM RAPOR */}
                {selectedRecord?.id === item.id && (
                  <View style={styles.expandedReportCard}>
                    <Text style={styles.expandedReportText}>{item.reportSummary}</Text>
                  </View>
                )}

                {/* İŞLEM BUTONLARI (WHATSAPP, DETAY, SİL) */}
                <View style={styles.crmActionsRow}>
                  <TouchableOpacity
                    style={styles.crmActionBtn}
                    onPress={() => setSelectedRecord(selectedRecord?.id === item.id ? null : item)}
                  >
                    <Ionicons
                      name={selectedRecord?.id === item.id ? "chevron-up" : "eye-outline"}
                      size={15}
                      color={COLORS.primary}
                    />
                    <Text style={styles.crmActionBtnText}>
                      {selectedRecord?.id === item.id ? 'Kapat' : 'Tam Rapor'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.crmActionBtn, styles.waBtn]}
                    onPress={() => shareCrmReportViaWhatsApp(item)}
                  >
                    <Ionicons name="logo-whatsapp" size={15} color="#059669" />
                    <Text style={[styles.crmActionBtnText, { color: '#059669' }]}>WhatsApp ile Paylaş</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.crmActionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteRecord(item.id)}
                  >
                    <Ionicons name="trash-outline" size={15} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: SPACING.md,
  },
  apiStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    gap: 8,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  apiStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.accentDark,
    flex: 1,
  },
  micWebCard: {
    height: 180,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
    ...SHADOWS.sm,
  },
  micWebView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.6,
    marginBottom: SPACING.xs,
  },
  quickScroll: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  quickChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    marginRight: 6,
    ...SHADOWS.sm,
  },
  quickChipText: {
    fontSize: 11,
    color: COLORS.text,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  clearText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
  },
  textCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  textInput: {
    fontSize: 13,
    color: COLORS.text,
    minHeight: 75,
    textAlignVertical: 'top',
    lineHeight: 19,
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.primaryGlow,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  summaryContainer: {
    marginTop: SPACING.lg,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  summaryText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    gap: 8,
    ...SHADOWS.sm,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  crmCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  crmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  crmCardTitleBlock: {
    flex: 1,
    marginRight: 8,
  },
  crmPropertyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  crmDateText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sentimentPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  pillRed: {
    backgroundColor: '#FEE2E2',
  },
  pillGreen: {
    backgroundColor: '#D1FAE5',
  },
  sentimentPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textRed: {
    color: '#DC2626',
  },
  textGreen: {
    color: '#059669',
  },
  crmTranscript: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: SPACING.sm,
  },
  expandedReportCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  expandedReportText: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 20,
  },
  crmActionsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  crmActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 5,
  },
  crmActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  waBtn: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  deleteBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    paddingHorizontal: 9,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
