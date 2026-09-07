import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  badgeText?: string;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onBack, rightAction, badgeText }) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftRow}>
        {onBack ? (
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={onBack} 
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.text} />
          </TouchableOpacity>
        ) : null}
        
        <View style={styles.titleContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {badgeText && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{badgeText}</Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>
      </View>

      {rightAction && (
        <View style={styles.rightActionWrapper}>
          {rightAction}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  badgeText: {
    color: COLORS.accentDark,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  rightActionWrapper: {
    marginLeft: SPACING.sm,
  },
});
