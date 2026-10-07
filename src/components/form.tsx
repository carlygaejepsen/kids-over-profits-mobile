import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { useSuggest } from '@/api/queries';
import { colors } from '@/theme/colors';
import { radius, spacing, touchTarget, type } from '@/theme/typography';
import { Icon } from './Icon';
import { NoticeBox } from './site';

/** A form section: the site's heading over a mint rule, then its fields. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

/** A labelled text box. The label is the accessibility label; the hint sits under it. */
export function Field({
  label,
  value,
  onChangeText,
  hint,
  placeholder,
  multiline,
  keyboardType,
  autoCapitalize = 'sentences',
  maxLength,
  secure,
  required,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words';
  maxLength?: number;
  secure?: boolean;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{required ? `${label} (required)` : label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={required ? `${label}, required` : label}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        secureTextEntry={secure}
        maxLength={maxLength}
        style={[styles.input, multiline && styles.multiline]}
      />
    </View>
  );
}

/** One choice out of several, shown as chips. The picked one is a solid fill with white text. */
export function Choice<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.choices}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            accessibilityLabel={o.label}
            style={({ pressed }) => [styles.choice, on ? styles.choiceOn : styles.choiceOff, pressed && styles.pressed]}>
            <Text style={[styles.choiceText, { color: on ? colors.white : colors.midnight }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Pressable
      onPress={() => onChange(!checked)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.checkRow, pressed && styles.pressed]}>
      <View style={[styles.box, checked && styles.boxOn]}>{checked ? <Icon name="check" size={18} color={colors.white} /> : null}</View>
      <Text style={styles.checkLabel}>{label}</Text>
    </Pressable>
  );
}

/** A message in the page: info, success, or problem. Never an alert dialog. */
export function Notice({ kind, title, children }: { kind: 'info' | 'ok' | 'warn' | 'error'; title?: string; children?: ReactNode }) {
  const body = typeof children === 'string' ? <Text style={styles.noticeText}>{children}</Text> : children;
  if (kind === 'info' || kind === 'warn') {
    return (
      <View accessibilityLiveRegion="polite">
        <NoticeBox variant="reporting" title={title}>{body}</NoticeBox>
      </View>
    );
  }
  const ok = kind === 'ok';
  return (
    <View
      accessibilityRole={ok ? undefined : 'alert'}
      accessibilityLiveRegion="polite"
      style={[styles.notice, ok ? styles.noticeOk : styles.noticeError]}>
      {title ? <Text accessibilityRole="header" style={[styles.noticeTitle, { color: ok ? colors.midnight : colors.coralPinkInk }]}>{title}</Text> : null}
      {body}
    </View>
  );
}

export type PickedFacility = { id: number | null; name: string };

/** Pick a facility with the same search the Search tab uses; or keep typing a name when it has no record. */
export function FacilityPicker({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: PickedFacility;
  onChange: (v: PickedFacility) => void;
  required?: boolean;
}) {
  const [text, setText] = useState(value.name);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value.name);
  useEffect(() => {
    const t = setTimeout(() => setQ(text), 300);
    return () => clearTimeout(t);
  }, [text]);
  const suggest = useSuggest(open && !value.id ? q : '');
  const items = (open && !value.id ? suggest.data?.items : undefined) ?? [];

  if (value.id) {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{required ? `${label} (required)` : label}</Text>
        <View style={styles.picked}>
          <Text style={styles.pickedName}>{value.name}</Text>
          <Pressable
            onPress={() => {
              setOpen(true);
              onChange({ id: null, name: '' });
            }}
            accessibilityRole="button"
            accessibilityLabel={`Change facility, now ${value.name}`}
            style={styles.change}>
            <Text style={styles.changeText}>Change</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.field}>
      <Field
        label={label}
        required={required}
        value={text}
        placeholder="Search by name or old name"
        hint="Pick a match, or leave the name as typed if it is not listed."
        onChangeText={(t) => {
          setText(t);
          setOpen(true);
          onChange({ id: null, name: t });
        }}
      />
      {items.slice(0, 6).map((it, i) => (
        <Pressable
          key={`${it.id ?? it.name}-${i}`}
          onPress={() => {
            setOpen(false);
            onChange({ id: it.id ?? null, name: it.name });
          }}
          accessibilityRole="button"
          accessibilityLabel={[it.name, it.hint, it.place].filter(Boolean).join('. ')}
          style={({ pressed }) => [styles.match, pressed && styles.pressed]}>
          <Text style={styles.matchName}>{it.name}</Text>
          {[it.hint, it.place].filter(Boolean).length ? (
            <Text style={styles.hint}>{[it.hint, it.place].filter(Boolean).join(' · ')}</Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...type.heading, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: colors.mintGreen },
  sectionBody: { marginTop: spacing.md, gap: spacing.md },
  field: { gap: spacing.xs },
  label: { ...type.smallBold },
  hint: { ...type.meta },
  input: {
    minHeight: touchTarget + 4,
    backgroundColor: colors.white,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: colors.tealInk,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.textPrimary,
  },
  multiline: { minHeight: 110, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  choice: { minHeight: touchTarget, justifyContent: 'center', borderRadius: radius.pill, borderWidth: 2, paddingHorizontal: spacing.md },
  choiceOn: { backgroundColor: colors.tealFill, borderColor: colors.tealFill },
  choiceOff: { backgroundColor: colors.white, borderColor: colors.tealInk },
  choiceText: { ...type.smallBold },
  pressed: { opacity: 0.7 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: touchTarget },
  checkLabel: { ...type.body, flex: 1 },
  box: {
    width: 26,
    height: 26,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.tealInk,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: { backgroundColor: colors.tealFill },
  notice: { padding: 16, gap: spacing.sm, marginBottom: spacing.md, borderLeftWidth: 4, borderTopRightRadius: radius.tile, borderBottomRightRadius: radius.tile },
  noticeOk: { backgroundColor: colors.mintGreen, borderLeftColor: colors.tealInk },
  noticeError: { backgroundColor: colors.white, borderLeftColor: colors.coralPinkInk, borderWidth: 1, borderColor: colors.cardBorder },
  noticeTitle: { ...type.subheading },
  noticeText: { ...type.body },
  picked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.tile,
    borderWidth: 2,
    borderColor: colors.tealInk,
    paddingLeft: spacing.md,
    minHeight: touchTarget + 4,
  },
  pickedName: { ...type.bodyBold, flex: 1 },
  change: { minHeight: touchTarget, minWidth: touchTarget, justifyContent: 'center', paddingHorizontal: spacing.md },
  changeText: { ...type.smallBold, color: colors.tealInk },
  match: {
    minHeight: touchTarget,
    backgroundColor: colors.white,
    borderRadius: radius.tile,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  matchName: { ...type.bodyBold },
});
