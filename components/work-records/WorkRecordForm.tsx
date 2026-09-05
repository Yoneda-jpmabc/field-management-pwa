"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CropIcon, IconChevronRight } from "@/components/icons";
import { CheckMark } from "@/components/ui/CheckMark";
import { RoundArrowButton } from "@/components/ui/RoundArrowButton";
import { createWorkRecords } from "@/lib/work-records/actions";
import { shiftAnchor } from "@/lib/work-records/period";
import { spansLunchBreak } from "@/lib/work-records/time";
import { TimeWheel } from "./TimeWheel";
import type {
  MasterOption,
  WorkCategoryOption,
  WorkerOption,
  WorkRecordFormState,
  WorkTypeOption,
  WorkTypeSuggestion,
} from "@/lib/work-records/types";

type Props = {
  /** サーバー側で Asia/Tokyo として求めた今日の日付（YYYY-MM-DD）。 */
  today: string;
  workers: WorkerOption[];
  workCategories: WorkCategoryOption[];
  workTypes: WorkTypeOption[];
  fields: MasterOption[];
  /** 圃場ごとの作付け中の作物 id。区分で選んだ作物に合う圃場だけへ絞り込む。 */
  fieldCropIds: Record<string, string[]>;
  workTypeSuggestions: WorkTypeSuggestion[];
  /** 過去の記録で多かった開始・終了時刻（"HH:MM"、頻度順）。ワンタップ入力用。 */
  startTimeSuggestions: string[];
  endTimeSuggestions: string[];
};

type Feedback = { tone: "success" | "danger"; message: string };

/**
 * 見出しに出す区分名の言い換え。DB の employment_type はそのまま（雇用区分としての意味を保つ）で、
 * 画面上の呼び名だけを現場の呼称に合わせる。
 */
const WORKER_GROUP_LABELS: Record<string, string> = {
  実習生: "Iチーム",
};

function workerGroupLabel(group: string | null): string {
  if (!group) return "その他";
  return WORKER_GROUP_LABELS[group] ?? group;
}

/**
 * 日付・時刻入力の共通スタイル。幅は用途ごとに外側の label で決める。
 * min-w-0 は必須: ネイティブの日付・時刻入力は中身に応じた最小幅を持つため
 * （iOS の日本語表示は「午前 8:00」と長い）、これが無いと枠からはみ出す。
 */
const dateTimeInputClass =
  "control-focus min-h-12 w-full min-w-0 rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground";

/**
 * 横スライドの並び順。実際のカードの並びと 1 対 1 で対応させること
 * （目印のドットと ←→ ボタンの端の判定がこれを見ている）。
 */
const STEP_TITLES = ["区分", "作業種類", "作業者", "日時", "圃場", "メモ"];

/** 今どのカードが正面に来ているか。端は必ず 0 と最後に丸める。 */
function nearestStep(track: HTMLElement): number {
  const raw = Math.round(track.scrollLeft / track.clientWidth);
  return Math.min(Math.max(raw, 0), STEP_TITLES.length - 1);
}

function createInitialState(today: string): WorkRecordFormState {
  return {
    workDate: today,
    startTime: "",
    endTime: "",
    workTypeId: null,
    workTypeRaw: "",
    selectedFieldIds: [],
    categoryId: null,
    cropId: null,
    selectedWorkerIds: [],
    memo: "",
    worksThroughLunch: false,
  };
}

export function WorkRecordForm({
  today,
  workers,
  workCategories,
  workTypes,
  fields,
  fieldCropIds,
  workTypeSuggestions,
  startTimeSuggestions,
  endTimeSuggestions,
}: Props) {
  const [form, setForm] = useState<WorkRecordFormState>(() =>
    createInitialState(today),
  );
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmRef = useRef<HTMLDivElement>(null);
  // ホイールとチップは 1 組だけ置き、開始／終了のどちらを編集中かで中身を差し替える。
  // 2 つ並べるとスマホ 1 画面に収まらないため。
  const [timeSide, setTimeSide] = useState<"start" | "end">("start");

  // モバイルは 6 枚のカードを横スライドで見せる。今どの枚目かは、指での
  // スワイプと ←→ ボタンで食い違わないよう、実際のスクロール位置から求める。
  const trackRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  // ←→ ボタンの起点。step は滑っている最中の通過点でも動くので、
  // それを起点にすると連打が 1 枚ぶんしか進まない。指なりボタンなりで
  // 止まったところだけをここに入れる。
  const settledStep = useRef(0);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 確認サマリーはフォーム末尾に出るため、開いたら見える位置まで運ぶ
  useEffect(() => {
    if (confirming) {
      confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [confirming]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
    },
    [],
  );

  // md 以上では横スクロールしない（overflow が visible）ので scrollLeft は
  // 常に 0 のまま。0 枚目を指し続けるだけで、矢印もドットも出ない。
  const handleTrackScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    setStep((prev) => {
      const next = nearestStep(track);
      return prev === next ? prev : next;
    });
    // 動きが止まってから起点を更新する。
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const settled = trackRef.current;
      if (settled && settled.clientWidth > 0) {
        settledStep.current = nearestStep(settled);
      }
    }, 120);
  };

  const goToStep = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.min(Math.max(index, 0), STEP_TITLES.length - 1);
    // カード幅は端数を持つので index × 幅だとじわじわずれる。実物の位置を使う。
    const slide = track.children[clamped] as HTMLElement | undefined;
    if (!slide) return;
    settledStep.current = clamped;
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  };

  // 選択したらタップの反応が見えるくらい待ってから次のカードへ送る。
  const advanceTo = (index: number) => {
    window.setTimeout(() => goToStep(index), 150);
  };

  // 26人を平らに並べると探しにくいので、雇用区分ごとの見出し付きに分ける。
  // 並び順は display_order のまま（区分内の順序も保たれる）。
  const workerGroups = useMemo(() => {
    const groups: { label: string; members: WorkerOption[] }[] = [];
    for (const worker of workers) {
      const label = workerGroupLabel(worker.group);
      const last = groups[groups.length - 1];
      if (last && last.label === label) {
        last.members.push(worker);
      } else {
        groups.push({ label, members: [worker] });
      }
    }
    return groups;
  }, [workers]);

  const update = <K extends keyof WorkRecordFormState>(
    key: K,
    value: WorkRecordFormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // 内容が変わったら確認サマリーは開き直させる（古い内容のまま確定させない）
    setConfirming(false);
    setFeedback(null);
  };

  const toggleWorker = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedWorkerIds: prev.selectedWorkerIds.includes(id)
        ? prev.selectedWorkerIds.filter((workerId) => workerId !== id)
        : [...prev.selectedWorkerIds, id],
    }));
    setConfirming(false);
    setFeedback(null);
  };

  const toggleField = (id: string) => {
    setForm((prev) => ({
      ...prev,
      selectedFieldIds: prev.selectedFieldIds.includes(id)
        ? prev.selectedFieldIds.filter((fieldId) => fieldId !== id)
        : [...prev.selectedFieldIds, id],
    }));
    setConfirming(false);
    setFeedback(null);
  };

  const selectedWorkerLabels = useMemo(
    () =>
      workers
        .filter((worker) => form.selectedWorkerIds.includes(worker.id))
        .map((worker) => worker.label),
    [workers, form.selectedWorkerIds],
  );

  // 区分を選ぶと、その区分に対応する作物（無ければ null）を crop_id 用に
  // 一緒に確定させる。区分を切り替えたら、別区分の作業種類が選ばれたままに
  // ならないよう workTypeId もクリアする。
  const selectCategory = (categoryId: string | null) => {
    const category = categoryId
      ? (workCategories.find((c) => c.id === categoryId) ?? null)
      : null;
    setForm((prev) => ({
      ...prev,
      categoryId,
      cropId: category?.cropId ?? null,
      workTypeId: null,
    }));
    setConfirming(false);
    setFeedback(null);
    // 区分を選んだら作業種類カードへ自動で進む（解除のときは進まない）。
    if (categoryId) advanceTo(1);
  };

  // 区分未選択のうちは何も出さない。選んだ区分に属する作業種類だけを出す。
  const visibleWorkTypes = useMemo(() => {
    if (!form.categoryId) return [];
    return workTypes.filter((type) => type.categoryId === form.categoryId);
  }, [workTypes, form.categoryId]);

  // 区分に紐づく作物が今作付けされている圃場だけに絞る。作付け記録が無い
  // 作物（マスタ登録直後など）で 0 件になったときは、絞り込まず全件出す
  // （圃場は必須ではないが、選べる圃場が消えて詰むのを避けるため）。
  const visibleFields = useMemo(() => {
    if (!form.cropId) return fields;
    const matched = fields.filter((field) =>
      fieldCropIds[field.id]?.includes(form.cropId as string),
    );
    return matched.length > 0 ? matched : fields;
  }, [fields, fieldCropIds, form.cropId]);

  const workTypeLabel = useMemo(() => {
    const fromMaster = workTypes.find((type) => type.id === form.workTypeId);
    const raw = form.workTypeRaw.trim();
    if (fromMaster && raw) return `${fromMaster.label}（メモ: ${raw}）`;
    if (fromMaster) return fromMaster.label;
    return raw || null;
  }, [workTypes, form.workTypeId, form.workTypeRaw]);

  const selectedFieldLabels = useMemo(
    () =>
      fields
        .filter((field) => form.selectedFieldIds.includes(field.id))
        .map((field) => field.label),
    [fields, form.selectedFieldIds],
  );
  // 未選択なら従来どおり「圃場なし」の1件。複数選んだときだけ作業者との組み合わせ数になる。
  const recordCount =
    form.selectedWorkerIds.length * Math.max(form.selectedFieldIds.length, 1);

  const categoryLabel =
    workCategories.find((category) => category.id === form.categoryId)
      ?.label ?? null;

  const timeLabel =
    form.startTime && form.endTime
      ? `${form.startTime} 〜 ${form.endTime}`
      : form.startTime
        ? `${form.startTime} 〜（終了未設定）`
        : form.endTime
          ? `（開始未設定）〜 ${form.endTime}`
          : null;

  const missing = [
    timeLabel ? null : "時間",
    categoryLabel ? null : "区分",
    workTypeLabel ? null : "作業種類",
    selectedFieldLabels.length > 0 ? null : "圃場",
    form.memo.trim() ? null : "メモ",
  ].filter((item): item is string => item !== null);

  const canSubmit = form.selectedWorkerIds.length > 0 && form.workDate !== "";

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await createWorkRecords(form);
      if (result.ok) {
        setForm(createInitialState(today));
        setConfirming(false);
        // 次の入力を前の続きから始めさせない。step は scroll イベントが直す。
        settledStep.current = 0;
        trackRef.current?.scrollTo({ left: 0 });
        setFeedback({
          tone: "success",
          message: `${result.insertedCount}件の作業実績を登録しました。`,
        });
      } else {
        setFeedback({ tone: "danger", message: result.message });
      }
    });
  };

  if (workers.length === 0) {
    return (
      <div className="surface-card p-5">
        <h2 className="text-[15px] font-semibold text-foreground">
          作業者マスタが空です
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
          作業実績は「誰の作業か」を必ず持つため、先に workers テーブルへ作業者を
          登録する必要があります。作業者名を教えてもらえれば投入します。
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 md:h-auto md:pb-4">
      {/*
        いま何番目かをヘッダー直下に出す。丸を 1 本の線でつなぎ、現在地までの
        アクセント線は幅をアニメーションさせて「伸びる」ように見せる。タップで移動。
        md 以上は縦積みで全項目が同時に見えるので出さない。
      */}
      {!confirming && (
        <div className="relative flex items-start md:hidden">
          {/* 円の中心どうしをつなぐ 1 本線（灰）。左端・右端は端の円の中心に合わせる。 */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[8.333%] right-[8.333%] top-[13px] h-0.5 overflow-hidden rounded-full bg-separator-strong"
          >
            {/* 現在地まで伸びるアクセント線。step が変わると width がなめらかに動く。 */}
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
              style={{
                width: `${(step / (STEP_TITLES.length - 1)) * 100}%`,
              }}
            />
          </div>
          {STEP_TITLES.map((title, index) => {
            const done = index < step;
            const current = index === step;
            return (
              <button
                key={title}
                type="button"
                onClick={() => goToStep(index)}
                aria-label={`${title}へ`}
                aria-current={current}
                className="control-focus relative z-10 flex flex-1 flex-col items-center gap-1 pt-0.5"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[11px] font-bold leading-none tabular-nums transition-[background-color,border-color,color,transform] duration-500 ease-out ${
                    current
                      ? "scale-110 border-accent bg-accent text-accent-foreground"
                      : done
                        ? "border-accent bg-accent text-accent-foreground"
                        : "border-separator-strong bg-surface text-foreground-tertiary"
                  }`}
                >
                  {index + 1}
                </span>
                <span
                  className={`whitespace-nowrap text-[11px] leading-tight transition-colors duration-500 ${
                    current
                      ? "font-bold text-foreground"
                      : done
                        ? "text-foreground-secondary"
                        : "text-foreground-tertiary"
                  }`}
                >
                  {title}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/*
        モバイルは横スクロール＋スナップで 1 枚ずつ見せる。縦に 6 枚積むと
        端から端まで転がす必要があり、片手だとつらいため。カードの中身が
        入りきらないときだけ、そのカードの中で縦に転がす。
        md 以上はマウスで縦に読めるので、これまでどおり縦に積む。

        確認サマリーはこの枠に重ねて出す。display:none で隠すと、ブラウザが
        横スクロール位置を 0 に戻してしまい、「戻る」で 1 枚目へ飛ぶため。
      */}
      <div className="relative flex min-h-0 flex-1 flex-col md:flex-none">
        <div
          ref={trackRef}
          onScroll={handleTrackScroll}
          className="no-scrollbar flex min-h-0 flex-1 gap-4 snap-x snap-mandatory scroll-smooth overflow-x-auto overflow-y-hidden overscroll-x-contain md:flex-none md:snap-none md:flex-col md:overflow-visible"
        >
          <Slide>
            <FormCard
              title="区分"
              hint="タップで選択。もう一度タップで解除できます。"
            >
              {workCategories.length === 0 ? (
                <p className="text-sm text-foreground-tertiary">
                  作業区分マスタが空です。登録すればここに一覧が出ます。
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {workCategories.map((category) => (
                    <GridChip
                      key={category.id}
                      label={category.label}
                      /* 名前が隣にあるのでアイコンは装飾扱い */
                      icon={
                        <CropIcon name={category.label} className="size-5" />
                      }
                      selected={form.categoryId === category.id}
                      onClick={() =>
                        selectCategory(
                          form.categoryId === category.id ? null : category.id,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </FormCard>
          </Slide>
          <Slide>
            <FormCard
              title="作業種類"
              hint={
                form.categoryId
                  ? "選んだ区分に合わせて表示しています。マスタに無ければ自由入力できます。"
                  : "区分を選ぶと作業種類が表示されます。"
              }
            >
              {visibleWorkTypes.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {visibleWorkTypes.map((type) => (
                    <Chip
                      key={type.id}
                      selected={form.workTypeId === type.id}
                      onClick={() => {
                        const next =
                          form.workTypeId === type.id ? null : type.id;
                        update("workTypeId", next);
                        // 作業種類を選んだら作業者カードへ自動で進む。
                        if (next) advanceTo(2);
                      }}
                    >
                      {type.label}
                    </Chip>
                  ))}
                </div>
              )}
              <input
                type="text"
                list="work-type-suggestions"
                value={form.workTypeRaw}
                onChange={(event) => update("workTypeRaw", event.target.value)}
                placeholder={
                  visibleWorkTypes.length > 0
                    ? "その他（自由入力）"
                    : "例: 防除 / 施肥 / 収穫"
                }
                className="control-focus min-h-12 w-full rounded-[10px] border border-separator-strong bg-surface px-3 text-base text-foreground placeholder:text-foreground-tertiary"
              />
              <datalist id="work-type-suggestions">
                {workTypeSuggestions.map((suggestion) => (
                  <option key={suggestion.value} value={suggestion.value} />
                ))}
              </datalist>
              {workTypeSuggestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {workTypeSuggestions.slice(0, 8).map((suggestion) => (
                    <Chip
                      key={suggestion.value}
                      selected={form.workTypeRaw === suggestion.value}
                      onClick={() =>
                        update(
                          "workTypeRaw",
                          form.workTypeRaw === suggestion.value
                            ? ""
                            : suggestion.value,
                        )
                      }
                    >
                      {suggestion.value}
                      <span className="ml-1 text-xs opacity-60">
                        {suggestion.count}
                      </span>
                    </Chip>
                  ))}
                </div>
              )}
            </FormCard>
          </Slide>
          <Slide>
            <FormCard title="作業者" required>
              {/* スクロールせず全員 1 画面に収める。1 行あたりの人数を増やし、
                見出しの余白を詰める。 */}
              <div className="flex flex-col gap-1">
                {workerGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-0.5 text-[11px] font-medium text-foreground-tertiary">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                      {group.members.map((worker) => (
                        <GridChip
                          key={worker.id}
                          dense
                          label={worker.label}
                          selected={form.selectedWorkerIds.includes(worker.id)}
                          onClick={() => toggleWorker(worker.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </FormCard>
          </Slide>
          <Slide>
            <FormCard title="日時" required>
              <div className="flex flex-col gap-4">
                <div>
                  <span className="mb-1.5 block text-sm text-foreground-secondary">
                    作業日
                  </span>
                  <div className="flex items-stretch gap-2">
                    <input
                      type="date"
                      aria-label="作業日"
                      value={form.workDate}
                      onChange={(event) =>
                        update("workDate", event.target.value)
                      }
                      className={dateTimeInputClass}
                    />
                    {/* 実績はほぼ前日ぶんの入力。ワンタップで 1 日戻せるようにする
                      （翌日以降を登録することはないので「翌日」は置かない）。 */}
                    <button
                      type="button"
                      onClick={() =>
                        update(
                          "workDate",
                          shiftAnchor("day", form.workDate, -1),
                        )
                      }
                      className="control-focus flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-[10px] border border-separator-strong px-3 text-sm font-bold text-foreground-secondary active:bg-surface-secondary"
                    >
                      <IconChevronRight
                        aria-hidden
                        className="h-4 w-4 shrink-0 rotate-180"
                      />
                      前日
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {/* 開始・終了の現在値。タップすると下のホイール／候補がその側を
                    編集する。1 行に 2 つ並べて縦を詰める。両方の値が常に見える。 */}
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { side: "start", label: "開始", value: form.startTime },
                        { side: "end", label: "終了", value: form.endTime },
                      ] as const
                    ).map(({ side, label, value }) => (
                      <button
                        key={side}
                        type="button"
                        aria-pressed={timeSide === side}
                        onClick={() => setTimeSide(side)}
                        className={`control-focus flex min-h-11 items-center justify-between gap-1 rounded-lg border px-3 text-[15px] ${
                          timeSide === side
                            ? "border-accent bg-accent-bg"
                            : "border-separator-strong"
                        }`}
                      >
                        <span className="font-bold text-foreground">
                          {label}
                        </span>
                        <span
                          className={`tabular-nums ${value ? "text-foreground" : "text-foreground-tertiary"}`}
                        >
                          {value || "未設定"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <TimeWheel
                    value={timeSide === "start" ? form.startTime : form.endTime}
                    onChange={(time) =>
                      update(
                        timeSide === "start" ? "startTime" : "endTime",
                        time,
                      )
                    }
                  />
                  <TimeChips
                    times={
                      timeSide === "start"
                        ? startTimeSuggestions
                        : endTimeSuggestions
                    }
                    current={
                      timeSide === "start" ? form.startTime : form.endTime
                    }
                    onPick={(time) => {
                      // 候補から選んだときだけ次へ送る。開始→終了へ、終了→次のカードへ。
                      // ホイールで合わせたときは何もしない。
                      if (timeSide === "start") {
                        update("startTime", time);
                        window.setTimeout(() => setTimeSide("end"), 150);
                      } else {
                        update("endTime", time);
                        // 12:00〜13:00 をまたぐと休憩チェックが出るので、
                        // その確認のため次のカードへは自動で進まない。
                        if (!spansLunchBreak(form.startTime, time)) {
                          advanceTo(4);
                        }
                      }
                    }}
                  />
                </div>
              </div>
              {spansLunchBreak(form.startTime, form.endTime) && (
                <label className="mt-3 flex items-center gap-2 text-sm text-foreground-secondary">
                  <input
                    type="checkbox"
                    checked={form.worksThroughLunch}
                    onChange={(event) => {
                      update("worksThroughLunch", event.target.checked);
                      // チェックしたら確認は済みなので圃場カードへ進む。
                      if (event.target.checked) advanceTo(4);
                    }}
                    className="peer sr-only"
                  />
                  <CheckMark
                    checked={form.worksThroughLunch}
                    className="peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:[outline-color:var(--accent)]"
                  />
                  休憩を含まない
                </label>
              )}
            </FormCard>
          </Slide>
          <Slide>
            {/* 圃場は 16 件あり、1 行 1 件だと縦スクロールが長くなるので
                作物・作業者と同じグリッドに揃える。
                区分で作物が決まっているときは、その作物をいま作付け中の
                圃場だけに絞る（該当が無ければ絞らず全件出す）。 */}
            <FormCard
              title="圃場"
              hint={
                form.cropId && visibleFields.length < fields.length
                  ? `${categoryLabel ?? ""}の圃場のみ表示中。複数の圃場にまたがるときは全部タップ。未設定のまま登録できます。`
                  : "複数の圃場にまたがるときは全部タップ。未設定のまま登録できます。"
              }
            >
              {visibleFields.length === 0 ? (
                <p className="text-sm text-foreground-tertiary">
                  圃場マスタが空です。登録すればここに一覧が出ます。
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {visibleFields.map((field) => (
                    <GridChip
                      key={field.id}
                      label={field.label}
                      selected={form.selectedFieldIds.includes(field.id)}
                      onClick={() => toggleField(field.id)}
                    />
                  ))}
                </div>
              )}
            </FormCard>
          </Slide>
          <Slide>
            <FormCard title="メモ">
              <textarea
                value={form.memo}
                onChange={(event) => update("memo", event.target.value)}
                rows={3}
                placeholder="任意"
                className="control-focus w-full resize-y rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground placeholder:text-foreground-tertiary"
              />
            </FormCard>
          </Slide>
        </div>

        {confirming && (
          <div
            ref={confirmRef}
            className="surface-card absolute inset-0 z-10 overflow-y-auto p-5 md:static md:mt-4 md:overflow-visible"
          >
            <h2 className="text-[15px] font-semibold text-foreground">
              この内容で登録されます
            </h2>
            <dl className="mt-3 flex flex-col gap-2 text-sm">
              <SummaryRow label="作業日" value={form.workDate} />
              <SummaryRow label="時間" value={timeLabel} />
              {spansLunchBreak(form.startTime, form.endTime) && (
                <SummaryRow
                  label="休憩"
                  value={form.worksThroughLunch ? "含まない" : "含む（-1時間）"}
                />
              )}
              <SummaryRow label="区分" value={categoryLabel} />
              <SummaryRow label="作業種類" value={workTypeLabel} />
              <SummaryRow
                label="圃場"
                value={selectedFieldLabels.join("、") || null}
              />
              <SummaryRow
                label="作業者"
                value={selectedWorkerLabels.join("、") || null}
              />
              <SummaryRow label="メモ" value={form.memo.trim() || null} />
            </dl>
            <p className="mt-4 text-sm font-medium text-foreground">
              {selectedFieldLabels.length > 1
                ? `作業者${selectedWorkerLabels.length}人 × 圃場${selectedFieldLabels.length}件で ${recordCount}件のレコードを作成します。`
                : `${recordCount}件のレコードを作成します。`}
            </p>
            {missing.length > 0 && (
              <p className="mt-1.5 text-sm text-warning">
                未設定: {missing.join("・")}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={pending}
                className="control-focus pressable min-h-11 flex-1 rounded-full bg-accent px-4 text-[15px] font-medium text-accent-foreground hover:bg-accent-hover disabled:bg-surface-secondary disabled:text-foreground-tertiary"
              >
                {pending ? "登録中…" : "確定して登録"}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={pending}
                className="control-focus pressable min-h-11 rounded-full border border-separator-strong px-4 text-[15px] font-medium text-foreground-secondary hover:bg-surface-secondary disabled:border-separator disabled:text-foreground-tertiary"
              >
                戻る
              </button>
            </div>
          </div>
        )}
      </div>

      {feedback && (
        <div
          role="status"
          className={`rounded-[10px] px-4 py-3 text-sm ${
            feedback.tone === "success"
              ? "bg-success-bg text-success"
              : "bg-danger-bg text-danger"
          }`}
        >
          {feedback.message}
          {feedback.tone === "success" && (
            <Link
              href="/records/list"
              className="control-focus mt-1 block font-medium underline underline-offset-2"
            >
              確認タブで見る（修正・削除もこちら）
            </Link>
          )}
        </div>
      )}

      {/* 送信ボタンの左右に前後の矢印。親指の届く場所に操作を集める。 */}
      {/*
        モバイルは <main> の pb-8（32px）ぶん下に余白が残り、ボタンが
        サブタブバーから浮く。同じ 32px を負のマージンと bottom で相殺して、
        サブタブバーのすぐ上に寄せる。md 以上は縦積みなので相殺しない。
      */}
      {!confirming && (
        <div className="sticky -bottom-8 -mb-8 flex items-center gap-2 md:bottom-0 md:mb-0">
          <RoundArrowButton
            direction="prev"
            label="前の項目へ"
            disabled={step === 0}
            onClick={() => goToStep(settledStep.current - 1)}
            className="md:hidden"
          />
          <button
            type="button"
            onClick={() => {
              setFeedback(null);
              setConfirming(true);
            }}
            disabled={!canSubmit}
            // 押せないときは薄くするのではなく、色そのものを地の灰色に落とす。
            // 半透明だと下の本文が透けて、文字が読みにくくなる。
            className="control-focus pressable min-h-11 flex-1 rounded-full bg-accent px-5 text-[15px] font-medium text-accent-foreground hover:bg-accent-hover disabled:bg-surface-secondary disabled:text-foreground-tertiary md:mx-auto md:flex-none"
          >
            {canSubmit
              ? `内容を確認（${recordCount}件）`
              : "作業者を選択してください"}
          </button>
          <RoundArrowButton
            direction="next"
            label="次の項目へ"
            disabled={step === STEP_TITLES.length - 1}
            onClick={() => goToStep(settledStep.current + 1)}
            className="md:hidden"
          />
        </div>
      )}
    </div>
  );
}

/**
 * スライド 1 枚ぶんの枠。モバイルは画面幅ちょうどで、はみ出す中身は
 * この中だけで縦に転がす。md 以上では枠として何もしない。
 */
function Slide({ children }: { children: ReactNode }) {
  return (
    <div className="no-scrollbar flex w-full shrink-0 snap-center flex-col overflow-y-auto md:block md:w-auto md:overflow-visible">
      {children}
    </div>
  );
}

function FormCard({
  title,
  hint,
  required,
  children,
}: {
  title: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    // モバイルはスライド高さいっぱいに伸ばして、カード下に地の色が余らないようにする。
    <section className="surface-card flex-1 p-5 md:flex-none">
      <h2 className="text-[15px] font-semibold text-foreground">
        {title}
        {required && <span className="ml-1.5 text-xs text-danger">必須</span>}
      </h2>
      {hint && (
        <p className="mt-1 mb-3 text-sm leading-relaxed text-foreground-tertiary">
          {hint}
        </p>
      )}
      <div className={hint ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function Chip({
  selected,
  onClick,
  children,
  /** レイアウト系クラスの差し替え口。未指定なら内容幅のチップ。 */
  className,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`control-focus pressable select-none rounded-full border ${
        // className を渡す側は高さ（min-h-* か h-*）も自分で指定する。
        className ?? "min-h-11 px-4 text-[15px]"
      } ${
        selected
          ? "border-accent bg-accent text-accent-foreground"
          : "border-separator-strong text-foreground hover:bg-surface-secondary"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * 過去によく使った時刻をワンタップで入れるチップ。時刻入力欄の下に置く。
 * iOS の時刻ホイールを回さずに、定時の開始・終了をそのまま選べるようにする。
 * 幅いっぱいの 4 列グリッドにして、行の右側に地の色が余らないようにする。
 */
function TimeChips({
  times,
  current,
  onPick,
}: {
  times: string[];
  current: string;
  onPick: (time: string) => void;
}) {
  if (times.length === 0) return null;
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {times.map((time) => (
        <Chip
          key={time}
          selected={current === time}
          onClick={() => onPick(time)}
          className="min-h-11 px-1 text-sm tabular-nums"
        >
          {time}
        </Chip>
      ))}
    </div>
  );
}

/**
 * グリッドに並べるボタンはすべて同じ幅・高さにする。
 * 中身が長いときはボタンを広げず、文字を小さく・長体にして収める。
 * アイコン付きはその分だけ文字に使える幅が狭いので、2文字分多く見積もる。
 */
function gridLabelClass(label: string, hasIcon: boolean): string {
  const length = [...label].length + (hasIcon ? 2 : 0);
  if (length <= 4) return "text-[15px]";
  if (length === 5) return "inline-block scale-x-90 text-[13px]";
  if (length === 6) return "inline-block scale-x-90 text-[12px]";
  return "inline-block scale-x-75 text-[12px]";
}

function GridChip({
  label,
  icon,
  selected,
  onClick,
  /** 人数が多いカード（作業者）向けに 1 段低くする。 */
  dense = false,
}: {
  label: string;
  /** 装飾用アイコン。ラベルと同じ意味なので読み上げ対象から外す。 */
  icon?: ReactNode;
  selected: boolean;
  onClick: () => void;
  dense?: boolean;
}) {
  return (
    <Chip
      selected={selected}
      onClick={onClick}
      className={`flex w-full items-center justify-center gap-1 overflow-hidden px-1.5 ${
        dense ? "h-[38px]" : "h-11"
      }`}
    >
      {icon && (
        <span aria-hidden className="flex shrink-0">
          {icon}
        </span>
      )}
      <span
        className={`whitespace-nowrap ${gridLabelClass(label, Boolean(icon))}`}
      >
        {label}
      </span>
    </Chip>
  );
}

function SummaryRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-3">
      <dt className="w-20 shrink-0 text-foreground-tertiary">{label}</dt>
      <dd className={value ? "text-foreground" : "text-foreground-tertiary"}>
        {value ?? "未設定"}
      </dd>
    </div>
  );
}
