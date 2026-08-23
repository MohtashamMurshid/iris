import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ASPECTS,
  CameraChrome,
  ChromeFonts,
  FILM_CONTROLS,
  LAB_TABS,
  LOOKS,
  OUTPUT_RESOLUTIONS,
  WB_PRESETS,
  lookById,
  type AspectId,
  type FilmControlId,
  type LabTab,
  type LookId,
  type OutputResolution,
  type WbPreset,
} from '@/features/camera/chrome';
import { CheckIcon } from '@/features/camera/chrome-icons';
import { GlassPanel } from '@/features/camera/glass-panel';
import { LookArtwork } from '@/features/camera/look-artwork';
import { ViewfinderMock } from '@/features/camera/viewfinder-mock';
import { ChipRow, ToggleChip } from '@/features/lab/chip-row';
import { HistogramMock } from '@/features/lab/histogram-mock';
import { Scrubber } from '@/features/lab/scrubber';

type PhotoLabProps = {
  initialLook?: LookId;
};

const INITIAL_FILM: Record<FilmControlId, { on: boolean; amount: number }> = {
  grain: { on: true, amount: 0.35 },
  halation: { on: true, amount: 0.2 },
  mtf: { on: true, amount: 0.45 },
  vignette: { on: false, amount: 0.15 },
};

export function PhotoLab({ initialLook = 'natural' }: PhotoLabProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<LabTab>('quick');
  const [lookId, setLookId] = useState<LookId>(initialLook);
  const [hdr, setHdr] = useState(true);
  const [filmSim, setFilmSim] = useState(true);
  const [exposure, setExposure] = useState(0.3);
  const [aspectId, setAspectId] = useState<AspectId>('3-2');
  const [level, setLevel] = useState(0);
  const [resolution, setResolution] = useState<OutputResolution>('4k');
  const [histogram, setHistogram] = useState(true);
  const [toneFusion, setToneFusion] = useState(false);
  const [film, setFilm] = useState(INITIAL_FILM);
  const [wb, setWb] = useState<WbPreset>('auto');
  const [kelvin, setKelvin] = useState(5600);
  const [tint, setTint] = useState(0);

  const look = lookById(lookId);
  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 16);

  function close() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }

  function setFilmAmount(id: FilmControlId, amount: number) {
    setFilm((current) => ({ ...current, [id]: { ...current[id], amount } }));
  }

  function toggleFilm(id: FilmControlId) {
    setFilm((current) => ({ ...current, [id]: { ...current[id], on: !current[id].on } }));
  }

  return (
    <View style={styles.page}>
      <View style={[styles.shell, { paddingBottom: bottomPad, paddingTop: topPad }]}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel="Close Photo Lab"
            onPress={close}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
            testID="lab-close">
            <Text style={styles.closeMark}>✕</Text>
          </Pressable>

          <ScrollView
            contentContainerStyle={styles.tabDial}
            horizontal
            showsHorizontalScrollIndicator={false}>
            {LAB_TABS.map((item) => {
              const selected = item.id === tab;
              return (
                <Pressable
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                  key={item.id}
                  onPress={() => setTab(item.id)}
                  style={({ pressed }) => [styles.tab, selected && styles.tabOn, pressed && styles.pressed]}
                  testID={`lab-tab-${item.id}`}>
                  <Text style={[styles.tabLabel, selected && styles.tabLabelOn]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            accessibilityLabel="Confirm edits"
            onPress={close}
            style={({ pressed }) => [styles.confirm, pressed && styles.pressed]}
            testID="lab-confirm">
            <CheckIcon color={CameraChrome.ink} size={20} />
          </Pressable>
        </View>

        <View style={styles.preview}>
          <ViewfinderMock height={280} lookId={lookId} overlay="off" width={210} />
        </View>

        <GlassPanel style={styles.pane}>
          <Text style={styles.paneKicker}>{look.name}</Text>
          {renderPane()}
        </GlassPanel>
      </View>
    </View>
  );

  function renderPane() {
    switch (tab) {
      case 'quick':
        return (
          <View style={styles.paneBody}>
            <ScrollView
              contentContainerStyle={styles.lookRow}
              horizontal
              showsHorizontalScrollIndicator={false}>
              {LOOKS.map((item) => {
                const selected = item.id === lookId;
                return (
                  <Pressable
                    accessibilityLabel={`${item.name} look`}
                    key={item.id}
                    onPress={() => setLookId(item.id)}
                    style={styles.lookItem}>
                    <LookArtwork look={item} selected={selected} size={52} />
                    <Text style={[styles.lookName, selected && styles.lookNameOn]}>{item.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <View style={styles.toggleRow}>
              <ToggleChip label="HDR" onPress={() => setHdr((value) => !value)} selected={hdr} />
              <ToggleChip label="Film" onPress={() => setFilmSim((value) => !value)} selected={filmSim} />
            </View>
            <Scrubber
              format={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`}
              label="Exposure"
              max={3}
              min={-3}
              onChange={setExposure}
              step={0.1}
              value={exposure}
            />
          </View>
        );
      case 'frame':
        return (
          <View style={styles.paneBody}>
            <ChipRow items={ASPECTS} onSelect={setAspectId} selectedId={aspectId} />
            <Scrubber
              format={(value) => `${value.toFixed(1)}°`}
              label="Level"
              max={15}
              min={-15}
              onChange={setLevel}
              step={0.5}
              value={level}
            />
            <ChipRow items={OUTPUT_RESOLUTIONS} onSelect={setResolution} selectedId={resolution} />
          </View>
        );
      case 'exposure':
        return (
          <View style={styles.paneBody}>
            {histogram ? <HistogramMock /> : null}
            <View style={styles.toggleRow}>
              <ToggleChip
                label="Histogram"
                onPress={() => setHistogram((value) => !value)}
                selected={histogram}
              />
              <ToggleChip
                label="Tone Fusion"
                onPress={() => setToneFusion((value) => !value)}
                selected={toneFusion}
              />
            </View>
            <Scrubber
              format={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)}`}
              label="Exposure"
              max={3}
              min={-3}
              onChange={setExposure}
              step={0.1}
              value={exposure}
            />
          </View>
        );
      case 'film':
        return (
          <ScrollView contentContainerStyle={styles.paneBody} showsVerticalScrollIndicator={false}>
            {FILM_CONTROLS.map((control) => {
              const state = film[control.id];
              return (
                <View key={control.id} style={styles.filmBlock}>
                  <View style={styles.filmHeader}>
                    <View>
                      <Text style={styles.filmTitle}>{control.label}</Text>
                      <Text style={styles.filmHint}>{control.hint}</Text>
                    </View>
                    <ToggleChip
                      label={state.on ? 'On' : 'Off'}
                      onPress={() => toggleFilm(control.id)}
                      selected={state.on}
                    />
                  </View>
                  <Scrubber
                    disabled={!state.on}
                    format={(value) => `${Math.round(value * 100)}%`}
                    label="Strength"
                    max={1}
                    min={0}
                    onChange={(amount) => setFilmAmount(control.id, amount)}
                    step={0.05}
                    value={state.amount}
                  />
                </View>
              );
            })}
          </ScrollView>
        );
      case 'balance':
        return (
          <View style={styles.paneBody}>
            <ChipRow items={WB_PRESETS} onSelect={setWb} selectedId={wb} />
            <Scrubber
              disabled={wb === 'auto'}
              format={(value) => `${Math.round(value)}K`}
              label="Kelvin"
              max={8000}
              min={2500}
              onChange={setKelvin}
              step={50}
              value={kelvin}
            />
            <Scrubber
              disabled={wb === 'auto'}
              format={(value) => `${value > 0 ? '+' : ''}${value.toFixed(0)}`}
              label="Tint"
              max={20}
              min={-20}
              onChange={setTint}
              step={1}
              value={tint}
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

const styles = StyleSheet.create({
  page: {
    alignItems: 'center',
    backgroundColor: CameraChrome.ink,
    flex: 1,
  },
  shell: {
    flex: 1,
    maxWidth: 430,
    paddingHorizontal: 12,
    width: '100%',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  closeMark: {
    color: CameraChrome.white,
    fontSize: 18,
    fontWeight: '600',
  },
  tabDial: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  tab: {
    borderCurve: 'continuous',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tabOn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabLabel: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelOn: {
    color: CameraChrome.white,
  },
  confirm: {
    alignItems: 'center',
    backgroundColor: CameraChrome.amber,
    borderRadius: 18,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  preview: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 220,
  },
  pane: {
    borderCurve: 'continuous',
    borderRadius: 32,
    minHeight: 250,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  paneKicker: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  paneBody: {
    gap: 16,
  },
  lookRow: {
    flexDirection: 'row',
    gap: 10,
  },
  lookItem: {
    alignItems: 'center',
    gap: 6,
    width: 60,
  },
  lookName: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 11,
  },
  lookNameOn: {
    color: CameraChrome.white,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filmBlock: {
    gap: 10,
  },
  filmHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filmTitle: {
    color: CameraChrome.white,
    fontFamily: ChromeFonts.sans,
    fontSize: 16,
    fontWeight: '600',
  },
  filmHint: {
    color: CameraChrome.muted,
    fontFamily: ChromeFonts.sans,
    fontSize: 12,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.72,
  },
});
