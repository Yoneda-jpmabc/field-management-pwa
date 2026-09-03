"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { CropIcon, IconChevronRight } from "@/components/icons";
import { createWorkRecords } from "@/lib/work-records/actions";
import {
  snapTimeToStep,
  spansLunchBreak,
  TIME_STEP_MINUTES,
} from "@/lib/work-records/time";
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
  workTypeSuggestions: WorkTypeSuggestion[];
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
const STEP_TITLES = ["日時", "作業者", "区分", "作業種類", "圃場", "メモ"];

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
    fieldId: null,
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
  workTypeSuggestions,
}: Props) {
  const [form, setForm] = useState<WorkRecordFormState>(() =>
    createInitialState(today),
  );
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmRef = useRef<HTMLDivElement>(null);

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
  };

  // 区分未選択のうちは何も出さない。選んだ区分に属する作業種類だけを出す。
  const visibleWorkTypes = useMemo(() => {
    if (!form.categoryId) return [];
    return workTypes.filter((type) => type.categoryId === form.categoryId);
  }, [workTypes, form.categoryId]);

  const workTypeLabel = useMemo(() => {
    const fromMaster = workTypes.find((type) => type.id === form.workTypeId);
    const raw = form.workTypeRaw.trim();
    if (fromMaster && raw) return `${fromMaster.label}（メモ: ${raw}）`;
    if (fromMaster) return fromMaster.label;
    return raw || null;
  }, [workTypes, form.workTypeId, form.workTypeRaw]);

  const fieldLabel =
    fields.find((field) => field.id === form.fieldId)?.label ?? null;

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
    fieldLabel ? null : "圃場",
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
          className="no-scrollbar flex min-h-0 flex-1 snap-x snap-mandatory scroll-smooth overflow-x-auto overflow-y-hidden overscroll-x-contain md:flex-none md:snap-none md:flex-col md:gap-4 md:overflow-visible"
        >
          <Slide>
            <FormCard title="日時" required>
              {/* 幅を固定すると端末のロケール次第で中身がはみ出すため、
                狭い画面は 2 列グリッド（作業日は 2 列ぶん・入力だけ幅を抑える）、
                広い画面は 3 つを 1 行に並べる。 */}
              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <label className="col-span-2 block min-w-0 sm:w-56">
                  <span className="mb-1.5 block text-sm text-foreground-secondary">
                    作業日
                  </span>
                  <input
                    type="date"
                    value={form.workDate}
                    onChange={(event) => update("workDate", event.target.value)}
                    className={`${dateTimeInputClass} max-w-56`}
                  />
                </label>
                <label className="block min-w-0 sm:w-40">
                  <span className="mb-1.5 block text-sm text-foreground-secondary">
                    開始
                  </span>
                  <input
                    type="time"
                    step={TIME_STEP_MINUTES * 60}
                    value={form.startTime}
                    onChange={(event) =>
                      update("startTime", event.target.value)
                    }
                    onBlur={(event) =>
                      update("startTime", snapTimeToStep(event.target.value))
                    }
                    className={dateTimeInputClass}
                  />
                </label>
                <label className="block min-w-0 sm:w-40">
                  <span className="mb-1.5 block text-sm text-foreground-secondary">
                    終了
                  </span>
                  <input
                    type="time"
                    step={TIME_STEP_MINUTES * 60}
                    value={form.endTime}
                    onChange={(event) => update("endTime", event.target.value)}
                    onBlur={(event) =>
                      update("endTime", snapTimeToStep(event.target.value))
                    }
                    className={dateTimeInputClass}
                  />
                </label>
              </div>
              {spansLunchBreak(form.startTime, form.endTime) && (
                <label className="mt-3 flex items-start gap-2 text-sm text-foreground-secondary">
                  <input
                    type="checkbox"
                    checked={form.worksThroughLunch}
                    onChange={(event) =>
                      update("worksThroughLunch", event.target.checked)
                    }
                    className="control-focus mt-0.5 size-5 shrink-0 rounded border-separator-strong"
                  />
                  <span>
                    休憩を含まない（12:00〜13:00をまたいでも休憩なしで作業した）
                    <br />
                    <span className="text-foreground-tertiary">
                      未チェックの場合、12:00〜13:00の1時間を集計から差し引きます。
                    </span>
                  </span>
                </label>
              )}
            </FormCard>
          </Slide>
          <Slide>
            <FormCard
              title="作業者"
              required
              hint="選んだ人数分のレコードをまとめて登録します。"
            >
              <div className="flex flex-col gap-4">
                {workerGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-xs font-medium text-foreground-tertiary">
                      {group.label}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {group.members.map((worker) => (
                        <GridChip
                          key={worker.id}
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
                      onClick={() =>
                        update(
                          "workTypeId",
                          form.workTypeId === type.id ? null : type.id,
                        )
                      }
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
            {/* 圃場は 16 件あり、1 行 1 件だと縦スクロールが長くなるので
                作物・作業者と同じグリッドに揃える。 */}
            <FormCard title="圃場" hint="未設定のまま登録できます。">
              {fields.length === 0 ? (
                <p className="text-sm text-foreground-tertiary">
                  圃場マスタが空です。登録すればここに一覧が出ます。
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {fields.map((field) => (
                    <GridChip
                      key={field.id}
                      label={field.label}
                      selected={form.fieldId === field.id}
                      onClick={() =>
                        update(
                          "fieldId",
                          form.fieldId === field.id ? null : field.id,
                        )
                      }
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
              <SummaryRow label="圃場" value={fieldLabel} />
              <SummaryRow
                label="作業者"
                value={selectedWorkerLabels.join("、") || null}
              />
              <SummaryRow label="メモ" value={form.memo.trim() || null} />
            </dl>
            <p className="mt-4 text-sm font-medium text-foreground">
              {selectedWorkerLabels.length}件のレコードを作成します。
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

      {/* 今どこにいるかの目印。タップでその項目へ飛べる。 */}
      {!confirming && (
        <div className="flex items-center justify-center md:hidden">
          {STEP_TITLES.map((title, index) => (
            <button
              key={title}
              type="button"
              onClick={() => goToStep(index)}
              aria-label={`${title}へ`}
              aria-current={index === step}
              className="control-focus flex h-6 w-6 items-center justify-center rounded-full"
            >
              <span
                className={`block size-1.5 rounded-full transition-colors ${
                  index === step ? "bg-accent" : "bg-separator-strong"
                }`}
              />
            </button>
          ))}
        </div>
      )}

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
          <StepArrow
            direction="prev"
            label="前の項目へ"
            disabled={step === 0}
            onClick={() => goToStep(settledStep.current - 1)}
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
              ? `内容を確認（${form.selectedWorkerIds.length}件）`
              : "作業者を選択してください"}
          </button>
          <StepArrow
            direction="next"
            label="次の項目へ"
            disabled={step === STEP_TITLES.length - 1}
            onClick={() => goToStep(settledStep.current + 1)}
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
    <div className="no-scrollbar w-full shrink-0 snap-center overflow-y-auto md:w-auto md:overflow-visible">
      {children}
    </div>
  );
}

/** スライドを 1 枚送る矢印。モバイルだけに出す。 */
function StepArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="control-focus pressable flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-separator-strong bg-surface text-foreground-secondary disabled:border-separator disabled:text-foreground-tertiary md:hidden"
    >
      <IconChevronRight
        className={`h-4 w-4 ${direction === "prev" ? "rotate-180" : ""}`}
      />
    </button>
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
    <section className="surface-card p-5">
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
      className={`control-focus pressable min-h-11 select-none rounded-full border ${
        className ?? "px-4 text-[15px]"
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
 * グリッドに並べるボタンはすべて同じ幅・高さにする。
 * 中身が長いときはボタンを広げず、文字を小さく・長体にして収める。
 * アイコン付きはその分だけ文字に使える幅が狭いので、2文字分多く見積もる。
 */
function gridLabelClass(label: string, hasIcon: boolean): string {
  const length = [...label].length + (hasIcon ? 2 : 0);
  if (length <= 5) return "text-[15px]";
  if (length === 6) return "text-[13px]";
  if (length === 7) return "inline-block scale-x-90 text-[12px]";
  return "inline-block scale-x-75 text-[12px]";
}

function GridChip({
  label,
  icon,
  selected,
  onClick,
}: {
  label: string;
  /** 装飾用アイコン。ラベルと同じ意味なので読み上げ対象から外す。 */
  icon?: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Chip
      selected={selected}
      onClick={onClick}
      className="flex h-11 w-full items-center justify-center gap-1 overflow-hidden px-1.5"
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
