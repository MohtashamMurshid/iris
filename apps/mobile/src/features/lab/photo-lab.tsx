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
  OVERLAYS,
  WB_PRESETS,
  type AspectId,
  type FilmControlId,
  type LabTab,
  type LookId,
  type OverlayId,
  type WbPreset,
} from '@/features/camera/chrome';
import {
  AspectRatioIcon,
  CheckIcon,
  ContrastIcon,
  DropletIcon,
  FilmStripIcon,
  FitIcon,
  GridCellsIcon,
  HistogramMiniIcon,
  LevelIcon,
  SparkleIcon,
  SunIcon,
  ThermometerIcon,
} from '@/features/camera/chrome-icons';
import { GlassPanel } from '@/features/camera/glass-panel';
import { hapticLight, hapticSelect, hapticSuccess } from '@/features/camera/haptics';
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
  const [overlay, setOverlay] = useState<OverlayId>('thirds');
  const [fitOn, setFitOn] = useState(false);
  const [level, setLevel] = useState(0);
  const [film, setFilm] = useState(INITIAL_FILM);
  const [wb, setWb] = useState<WbPreset>('auto');
  const [kelvin, setKelvin] = useState(5600);
  const [tint, setTint] = useState(10);
  const [presetOpen, setPresetOpen] = useState(false);
  const [preview, setPreview] = useState({ width: 0, height: 0 });

  const topPad = Math.max(insets.top, 10);
  const bottomPad = Math.max(insets.bottom, 14);
  const previewOverlay = tab === 'frame' ? overlay : 'off';

  function leave() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }

  function close() {
    hapticLight();
    leave();
  }

  function confirm() {
    hapticSuccess();
    leave();
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
      style={[styles.preview, tab === 'frame' && styles.previewFramed, fitOn && styles.previewFit]}>
      {preview.width > 8 && preview.height > 8 ? (
        <ViewfinderMock
          height={preview.height}
          lookId={lookId}
          overlay={previewOverlay}
          width={preview.width}
        />
      ) : null}
    </View>
  );

  const tabs = <LabTabDial onChange={setTab} tab={tab} />;

  const actions = (
    <View style={styles.actionBar}>
      <Pressable
        accessibilityLabel="Close Photo Lab"
        onPress={close}
        style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
        testID="lab-close">
        <Text style={styles.closeMark}>✕</Text>
      </Pressable>
      {!wide ? (
        <GlassPanel style={styles.toolPill}>
          {contextTools(
            tab,
            aspectId,
            overlay,
            fitOn,
            setAspectId,
            setOverlay,
            setFitOn,
            () => setPresetOpen((value) => !value),
          )}
        </GlassPanel>
      ) : (
        <View style={styles.toolSpacer} />
      )}
      <Pressable
        accessibilityLabel="Confirm edits"
        onPress={confirm}
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
              {tab === 'frame' ? (
                <View style={styles.instrument}>
                  <AnalogDial
                    accessibilityLabel="Level"
                    format={(value) => value.toFixed(1)}
                    iconNode={<LevelIcon />}
                    max={15}
                    min={-15}
                    onChange={setLevel}
                    step={0.5}
                    value={level}
                  />
                </View>
              ) : (
                <>
                  <Text style={styles.section}>QUICK EDIT</Text>
                  <LookRow lookId={lookId} onSelect={setLookId} />
                  <View style={styles.sectionRow}>
                    <Text style={styles.section}>EXPOSURE</Text>
                    <View style={styles.sectionIcons}>
                      <HistogramMiniIcon />
                      <ContrastIcon />
                    </View>
                  </View>
                  <View style={styles.instrument}>
                    <AnalogDial
                      accessibilityLabel="Exposure"
                      format={signed}
                      iconNode={<SunIcon />}
                      max={3}
                      min={-3}
                      onChange={setExposure}
                      value={exposure}
                    />
                  </View>
                  <View style={styles.sectionRow}>
                    <Text style={styles.section}>FILM</Text>
                    <View style={styles.sectionIcons}>
                      <FilmStripIcon />
                      <ContrastIcon />
                    </View>
                  </View>
                  <View style={styles.instrument}>
                    <FilmRow film={film} onChange={setFilmValue} />
                  </View>
                  <View style={styles.sectionRow}>
                    <Text style={styles.section}>BALANCE</Text>
                    <PresetButton onPress={() => setPresetOpen((value) => !value)} />
                  </View>
                  <View style={styles.instrument}>
                    <AnalogDial
                      accessibilityLabel="Tint"
                      format={signed}
                      iconNode={<DropletIcon />}
                      max={40}
                      min={-40}
                      onChange={setTint}
                      step={1}
                      value={tint}
                    />
                    <AnalogDial
                      accessibilityLabel="Temperature"
                      format={(value) => `${Math.round(value)}K`}
                      iconNode={<ThermometerIcon />}
                      max={8000}
                      min={2500}
                      onChange={setKelvin}
                      step={50}
                      value={kelvin}
                    />
                  </View>
                  {presetOpen ? (
                    <PresetList
                      onPick={(id) => {
                        setWb(id);
                        setPresetOpen(false);
                      }}
                      selected={wb}
                    />
                  ) : null}
                </>
              )}
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
          <PresetList
            onPick={(id) => {
              setWb(id);
              setPresetOpen(false);
            }}
            selected={wb}
          />
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
            <View style={styles.instrument}>
              <AnalogDial
                accessibilityLabel="Exposure"
                format={signed}
                iconNode={<SunIcon />}
                max={3}
                min={-3}
                onChange={setExposure}
                value={exposure}
              />
            </View>
          </View>
        );
      case 'frame':
        return (
          <View style={styles.paneBody}>
            <View style={styles.instrument}>
              <AnalogDial
                accessibilityLabel="Level"
                format={(value) => value.toFixed(1)}
                iconNode={<LevelIcon />}
                max={15}
                min={-15}
                onChange={setLevel}
                step={0.5}
                value={level}
              />
            </View>
          </View>
        );
      case 'exposure':
        return (
          <View style={styles.instrument}>
            <RgbHistogram />
            <AnalogDial
              accessibilityLabel="Exposure"
              format={signed}
              iconNode={<SunIcon />}
              max={3}
              min={-3}
              onChange={setExposure}
              value={exposure}
            />
            <AnalogDial
              accessibilityLabel="Contrast"
              format={signed}
              iconNode={<ContrastIcon />}
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
        return (
          <View style={styles.instrument}>
            <FilmRow film={film} onChange={setFilmValue} />
          </View>
        );
      case 'balance':
        return (
          <View style={styles.instrument}>
            <AnalogDial
              accessibilityLabel="Tint"
              format={(value) => signed(value, 2)}
              iconNode={<DropletIcon />}
              max={40}
              min={-40}
              onChange={setTint}
              step={1}
              value={tint}
            />
            <AnalogDial
              accessibilityLabel="Temperature"
              format={(value) => `${Math.round(value)}K`}
              iconNode={<ThermometerIcon />}
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

function LabTabDial({ tab, onChange }: { tab: LabTab; onChange: (id: LabTab) => void }) {
  const index = LAB_TABS.findIndex((item) => item.id === tab);
  const current = LAB_TABS[index];
  const prev = index > 0 ? LAB_TABS[index - 1] : undefined;
  const next = index < LAB_TABS.length - 1 ? LAB_TABS[index + 1] : undefined;

  if (!current) return null;

  return (
    <View style={styles.tabRow}>
      <Pressable
        disabled={!prev}
        onPress={() => {
          if (!prev) return;
          hapticSelect();
          onChange(prev.id);
        }}
        style={styles.tabSide}
        testID={prev ? `lab-tab-${prev.id}` : undefined}>
        <Text style={styles.tabLabel}>{prev?.label ?? ' '}</Text>
      </Pressable>
      <Text style={[styles.tabLabel, styles.tabLabelOn]} testID={`lab-tab-${current.id}`}>
        {current.label}
      </Text>
      <Pressable
        disabled={!next}
        onPress={() => {
          if (!next) return;
          hapticSelect();
          onChange(next.id);
        }}
        style={styles.tabSide}
        testID={next ? `lab-tab-${next.id}` : undefined}>
        <Text style={styles.tabLabel}>{next?.label ?? ' '}</Text>
      </Pressable>
    </View>
  );
}

function LookRow({ lookId, onSelect }: { lookId: LookId; onSelect: (id: LookId) => void }) {
  return (
    <View style={styles.lookRow}>
      {LOOKS.map((item) => {
        const selected = item.id === lookId;
        return (
          <Pressable
            accessibilityLabel={`${item.name} look`}
            key={item.id}
            onPress={() => {
              hapticSelect();
              onSelect(item.id);
            }}
            style={styles.lookItem}
            testID={`lab-look-${item.id}`}>
            <LookArtwork look={item} selected={selected} size={58} />
            <Text style={[styles.lookName, selected && styles.lookNameOn]}>{item.name}</Text>
          </Pressable>
        );
      })}
    </View>
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

function PresetButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        hapticSelect();
        onPress();
      }}
      style={styles.presetButton}
      testID="lab-preset">
      <SunIcon size={12} />
      <Text style={styles.presetText}>PRESET</Text>
      <Text style={styles.toolCaption}>∨</Text>
    </Pressable>
  );
}

function PresetList({
  selected,
  onPick,
}: {
  selected: WbPreset;
  onPick: (id: WbPreset) => void;
}) {
  return (
    <View style={styles.presetList}>
      {WB_PRESETS.map((preset) => (
        <Pressable
          key={preset.id}
          onPress={() => {
            hapticSelect();
            onPick(preset.id);
          }}
          style={styles.presetRow}>
          <Text style={[styles.presetLabel, selected === preset.id && styles.presetOn]}>{preset.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function contextTools(
  tab: LabTab,
  aspectId: AspectId,
  overlay: OverlayId,
  fitOn: boolean,
  onAspect: (id: AspectId) => void,
  onOverlay: (id: OverlayId) => void,
  onFit: (value: boolean) => void,
  onPreset: () => void,
) {
  switch (tab) {
    case 'frame':
      return (
        <View style={styles.toolRow}>
          <Pressable
            accessibilityLabel={`Aspect ${ASPECTS.find((item) => item.id === aspectId)?.label}`}
            onPress={() => {
              hapticSelect();
              onAspect(nextAspect(aspectId));
            }}>
            <AspectRatioIcon size={18} />
          </Pressable>
          <Pressable
            accessibilityLabel={`Overlay ${overlay}`}
            onPress={() => {
              hapticSelect();
              onOverlay(nextOverlay(overlay));
            }}>
            <GridCellsIcon size={16} />
          </Pressable>
          <Pressable
            accessibilityLabel={fitOn ? 'Fit on' : 'Fit off'}
            onPress={() => {
              hapticSelect();
              onFit(!fitOn);
            }}>
            <FitIcon size={16} />
          </Pressable>
        </View>
      );
    case 'quick':
      return (
        <View style={styles.toolRow}>
          <SparkleIcon />
          <FilmStripIcon />
        </View>
      );
    case 'exposure':
      return (
        <View style={styles.toolRow}>
          <HistogramMiniIcon />
          <ContrastIcon />
          <SunIcon />
        </View>
      );
    case 'film':
      return (
        <View style={styles.toolRow}>
          {FILM_CONTROLS.slice(0, 5).map((control) => (
            <Text key={control.id} style={styles.toolGlyph}>
              {control.glyph}
            </Text>
          ))}
        </View>
      );
    case 'balance':
      return <PresetButton onPress={onPreset} />;
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

function nextOverlay(current: OverlayId): OverlayId {
  const index = OVERLAYS.findIndex((item) => item.id === current);
  return OVERLAYS[(index + 1) % OVERLAYS.length]?.id ?? 'thirds';
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
  previewFit: {
    marginHorizontal: 22,
    marginVertical: 12,
  },
  tabRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  tabSide: {
    flex: 1,
  },
  tabLabel: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  tabLabelOn: {
    color: CameraChrome.white,
    flex: 1.2,
    fontSize: 13,
  },
  pane: {
    minHeight: 210,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  paneBody: {
    gap: 14,
  },
  instrument: {
    backgroundColor: '#121212',
    borderCurve: 'continuous',
    borderRadius: 22,
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  lookRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  lookItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  lookName: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 11,
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
  toolSpacer: {
    flex: 1,
  },
  toolRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
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
    gap: 6,
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
    paddingBottom: 8,
  },
  presetRow: {
    justifyContent: 'center',
    minHeight: 36,
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
    gap: 14,
    paddingBottom: 16,
  },
  section: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  sectionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  sectionIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  pressed: {
    opacity: 0.7,
  },
});
