import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ASPECTS,
  CameraChrome,
  ChromeFonts,
  FILM_CONTROLS,
  LAB_TABS,
  LOOKS,
  WB_PRESETS,
  type AspectId,
  type FilmControlId,
  type LabTab,
  type LookId,
  type WbPreset,
} from '@/features/camera/chrome';
import { CheckIcon } from '@/features/camera/chrome-icons';
import { GlassPanel } from '@/features/camera/glass-panel';
import { LookArtwork } from '@/features/camera/look-artwork';
import { ViewfinderMock } from '@/features/camera/viewfinder-mock';
import { AnalogDial, VerticalDial } from '@/features/lab/analog-dial';
import { RgbHistogram, ToneCurve } from '@/features/lab/lab-graphs';

type PhotoLabProps = {
  initialLook?: LookId;
};

const INITIAL_FILM: Record<FilmControlId, number> = {
  grain: 0.4,
  halation: 1,
  bloom: 5,
  mtf: 2,
  haze: 0.5,
  vignette: 0.2,
};

export function PhotoLab({ initialLook = 'natural' }: PhotoLabProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const wide = width >= 740;
  const [tab, setTab] = useState<LabTab>('quick');
  const [lookId, setLookId] = useState<LookId>(initialLook);
  const [exposure, setExposure] = useState(0.3);
  const [contrast, setContrast] = useState(0.4);
  const [aspectId, setAspectId] = useState<AspectId>('3-2');
  const [level, setLevel] = useState(0);
  const [film, setFilm] = useState(INITIAL_FILM);
  const [wb, setWb] = useState<WbPreset>('auto');
  const [kelvin, setKelvin] = useState(5600);
  const [tint, setTint] = useState(10);
  const [presetOpen, setPresetOpen] = useState(false);
  const [preview, setPreview] = useState({ width: 0, height: 0 });

  const topPad = Math.max(insets.top, 10);
  const bottomPad = Math.max(insets.bottom, 14);

  function close() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }

  function setFilmValue(id: FilmControlId, amount: number) {
    setFilm((current) => ({ ...current, [id]: amount }));
  }

  const previewNode = (
    <View
      onLayout={(event) => {
        const next = event.nativeEvent.layout;
        setPreview({ width: next.width, height: next.height });
      }}
      style={[styles.preview, tab === 'frame' && styles.previewFramed]}>
      {preview.width > 8 && preview.height > 8 ? (
        <ViewfinderMock
          height={preview.height}
          lookId={lookId}
          overlay={tab === 'frame' ? 'thirds' : 'off'}
          width={preview.width}
        />
      ) : null}
    </View>
  );

  const tabs = (
    <View style={styles.tabRow}>
      {LAB_TABS.map((item) => {
        const selected = item.id === tab;
        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            key={item.id}
            onPress={() => setTab(item.id)}
            style={styles.tab}
            testID={`lab-tab-${item.id}`}>
            <Text style={[styles.tabLabel, selected && styles.tabLabelOn]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  const actions = (
    <View style={styles.actionBar}>
      <Pressable
        accessibilityLabel="Close Photo Lab"
        onPress={close}
        style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
        testID="lab-close">
        <Text style={styles.closeMark}>✕</Text>
      </Pressable>
      <GlassPanel style={styles.toolPill}>{contextTools(tab, aspectId, setAspectId, () => setPresetOpen((v) => !v))}</GlassPanel>
      <Pressable
        accessibilityLabel="Confirm edits"
        onPress={close}
        style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
        testID="lab-confirm">
        <CheckIcon color={CameraChrome.ink} size={22} />
      </Pressable>
    </View>
  );

  if (wide) {
    return (
      <View style={[styles.page, { paddingBottom: bottomPad, paddingTop: topPad }]}>
        <View style={styles.wideRow}>
          <View style={styles.widePreview}>{previewNode}</View>
          <View style={styles.sidebar}>
            {tabs}
            <ScrollView contentContainerStyle={styles.sidebarBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.section}>QUICK EDIT</Text>
              <LookRow lookId={lookId} onSelect={setLookId} />
              <Text style={styles.section}>EXPOSURE</Text>
              <AnalogDial
                accessibilityLabel="Exposure"
                format={signed}
                icon="☀"
                max={3}
                min={-3}
                onChange={setExposure}
                value={exposure}
              />
              <Text style={styles.section}>FILM</Text>
              <FilmRow film={film} onChange={setFilmValue} />
              <Text style={styles.section}>BALANCE</Text>
              <AnalogDial
                accessibilityLabel="Tint"
                format={signed}
                icon="💧"
                max={40}
                min={-40}
                onChange={setTint}
                step={1}
                value={tint}
              />
              <AnalogDial
                accessibilityLabel="Temperature"
                format={(value) => `${Math.round(value)}K`}
                icon="°"
                max={8000}
                min={2500}
                onChange={setKelvin}
                step={50}
                value={kelvin}
              />
            </ScrollView>
            {actions}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.page, { paddingBottom: bottomPad, paddingTop: topPad }]}>
      <View style={styles.phone}>
        {previewNode}
        {tabs}
        <View style={styles.pane}>{renderPane()}</View>
        {presetOpen && tab === 'balance' ? (
          <View style={styles.presetList}>
            {WB_PRESETS.map((preset) => (
              <Pressable
                key={preset.id}
                onPress={() => {
                  setWb(preset.id);
                  setPresetOpen(false);
                }}
                style={styles.presetRow}>
                <Text style={[styles.presetLabel, wb === preset.id && styles.presetOn]}>{preset.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {actions}
      </View>
    </View>
  );

  function renderPane() {
    switch (tab) {
      case 'quick':
        return (
          <View style={styles.paneBody}>
            <LookRow lookId={lookId} onSelect={setLookId} />
            <AnalogDial
              accessibilityLabel="Exposure"
              format={signed}
              icon="☀"
              max={3}
              min={-3}
              onChange={setExposure}
              value={exposure}
            />
          </View>
        );
      case 'frame':
        return (
          <View style={styles.paneBody}>
            <AnalogDial
              accessibilityLabel="Level"
              format={(value) => `${value.toFixed(1)}`}
              icon="▭"
              max={15}
              min={-15}
              onChange={setLevel}
              step={0.5}
              value={level}
            />
          </View>
        );
      case 'exposure':
        return (
          <View style={styles.paneBody}>
            <RgbHistogram />
            <AnalogDial
              accessibilityLabel="Exposure"
              format={signed}
              icon="☀"
              max={3}
              min={-3}
              onChange={setExposure}
              value={exposure}
            />
            <AnalogDial
              accessibilityLabel="Contrast"
              format={signed}
              icon="◐"
              max={10}
              min={-10}
              onChange={setContrast}
              step={0.1}
              value={contrast}
            />
            <ToneCurve />
          </View>
        );
      case 'film':
        return <FilmRow film={film} onChange={setFilmValue} />;
      case 'balance':
        return (
          <View style={styles.paneBody}>
            <AnalogDial
              accessibilityLabel="Tint"
              format={(value) => signed(value, 2)}
              icon="💧"
              max={40}
              min={-40}
              onChange={setTint}
              step={1}
              value={tint}
            />
            <AnalogDial
              accessibilityLabel="Temperature"
              format={(value) => `${Math.round(value)}K`}
              icon="°"
              max={8000}
              min={2500}
              onChange={setKelvin}
              step={50}
              value={kelvin}
            />
          </View>
        );
      default: {
        const _never: never = tab;
        return _never;
      }
    }
  }
}

function LookRow({ lookId, onSelect }: { lookId: LookId; onSelect: (id: LookId) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.lookRow} horizontal showsHorizontalScrollIndicator={false}>
      {LOOKS.map((item) => {
        const selected = item.id === lookId;
        return (
          <Pressable
            accessibilityLabel={`${item.name} look`}
            key={item.id}
            onPress={() => onSelect(item.id)}
            style={styles.lookItem}
            testID={`lab-look-${item.id}`}>
            <LookArtwork look={item} selected={selected} size={72} />
            <Text style={[styles.lookName, selected && styles.lookNameOn]}>{item.name}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function FilmRow({
  film,
  onChange,
}: {
  film: Record<FilmControlId, number>;
  onChange: (id: FilmControlId, value: number) => void;
}) {
  return (
    <View style={styles.filmRow}>
      {FILM_CONTROLS.map((control) => (
        <VerticalDial
          format={signed}
          glyph={control.glyph}
          key={control.id}
          label={control.label}
          max={control.max}
          min={control.min}
          onChange={(value) => onChange(control.id, value)}
          step={control.step}
          value={film[control.id]}
        />
      ))}
    </View>
  );
}

function contextTools(
  tab: LabTab,
  aspectId: AspectId,
  onAspect: (id: AspectId) => void,
  onPreset: () => void,
) {
  switch (tab) {
    case 'frame':
      return (
        <View style={styles.toolRow}>
          <Text style={styles.toolGlyph}>▯</Text>
          <Text style={styles.toolGlyph}>⊞</Text>
          <Text style={styles.toolGlyph}>⛶</Text>
          <Text style={styles.toolCaption}>{ASPECTS.find((item) => item.id === aspectId)?.label}</Text>
          <Pressable onPress={() => onAspect(nextAspect(aspectId))}>
            <Text style={styles.toolCaption}>cycle</Text>
          </Pressable>
        </View>
      );
    case 'quick':
      return (
        <View style={styles.toolRow}>
          <Text style={styles.toolGlyph}>✦</Text>
          <Text style={styles.toolGlyph}>≡</Text>
        </View>
      );
    case 'exposure':
      return (
        <View style={styles.toolRow}>
          <Text style={styles.toolGlyph}>⋮</Text>
          <Text style={styles.toolGlyph}>|||</Text>
          <Text style={styles.toolGlyph}>◐</Text>
        </View>
      );
    case 'film':
      return (
        <View style={styles.toolRow}>
          {FILM_CONTROLS.map((control) => (
            <Text key={control.id} style={styles.toolGlyph}>
              {control.glyph}
            </Text>
          ))}
        </View>
      );
    case 'balance':
      return (
        <Pressable onPress={onPreset} style={styles.presetButton} testID="lab-preset">
          <Text style={styles.toolGlyph}>☀</Text>
          <Text style={styles.presetText}>PRESET</Text>
          <Text style={styles.toolGlyph}>∨</Text>
        </Pressable>
      );
    default: {
      const _never: never = tab;
      return _never;
    }
  }
}

function nextAspect(current: AspectId): AspectId {
  const index = ASPECTS.findIndex((item) => item.id === current);
  return ASPECTS[(index + 1) % ASPECTS.length]?.id ?? '3-2';
}

function signed(value: number, digits = 1): string {
  const body = value.toFixed(digits);
  return value > 0 ? `+${body}` : body;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: CameraChrome.ink,
    flex: 1,
  },
  phone: {
    alignSelf: 'center',
    flex: 1,
    maxWidth: 430,
    width: '100%',
  },
  preview: {
    backgroundColor: '#111',
    flex: 1,
    minHeight: 240,
    overflow: 'hidden',
  },
  previewFramed: {
    borderColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    marginHorizontal: 10,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tab: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  tabLabel: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  tabLabelOn: {
    color: CameraChrome.white,
  },
  pane: {
    minHeight: 210,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  paneBody: {
    gap: 14,
  },
  lookRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 4,
  },
  lookItem: {
    alignItems: 'center',
    gap: 6,
    width: 78,
  },
  lookName: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
  },
  lookNameOn: {
    color: CameraChrome.white,
  },
  filmRow: {
    flexDirection: 'row',
    gap: 4,
    paddingTop: 4,
  },
  actionBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  roundButton: {
    alignItems: 'center',
    backgroundColor: '#2A2A2C',
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  closeMark: {
    color: CameraChrome.white,
    fontSize: 18,
    fontWeight: '500',
  },
  confirm: {
    alignItems: 'center',
    backgroundColor: CameraChrome.amber,
    borderRadius: 18,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  toolPill: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 22,
    flex: 1,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  toolRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
    justifyContent: 'center',
  },
  toolGlyph: {
    color: CameraChrome.white,
    fontSize: 14,
  },
  toolCaption: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
  },
  presetButton: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  presetText: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  presetList: {
    paddingHorizontal: 18,
  },
  presetRow: {
    minHeight: 36,
    justifyContent: 'center',
  },
  presetLabel: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 15,
  },
  presetOn: {
    color: CameraChrome.amber,
  },
  wideRow: {
    flex: 1,
    flexDirection: 'row',
  },
  widePreview: {
    flex: 1,
  },
  sidebar: {
    backgroundColor: CameraChrome.ink,
    borderLeftColor: CameraChrome.glassBorder,
    borderLeftWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    width: 360,
  },
  sidebarBody: {
    gap: 16,
    paddingBottom: 16,
  },
  section: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginTop: 8,
  },
  pressed: {
    opacity: 0.7,
  },
});
