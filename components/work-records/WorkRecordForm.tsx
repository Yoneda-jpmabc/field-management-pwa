"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { createWorkRecords } from "@/lib/work-records/actions";
import type {
  MasterOption,
  WorkerOption,
  WorkRecordFormState,
  WorkTypeSuggestion,
} from "@/lib/work-records/types";

type Props = {
  /** サーバー側で Asia/Tokyo として求めた今日の日付（YYYY-MM-DD）。 */
  today: string;
  workers: WorkerOption[];
  workTypes: MasterOption[];
  fields: MasterOption[];
  crops: MasterOption[];
  workTypeSuggestions: WorkTypeSuggestion[];
};

type Feedback = { tone: "success" | "danger"; message: string };

function createInitialState(today: string): WorkRecordFormState {
  return {
    workDate: today,
    startTime: "",
    endTime: "",
    workTypeId: null,
    workTypeRaw: "",
    fieldId: null,
    cropId: null,
    selectedWorkerIds: [],
    memo: "",
  };
}

export function WorkRecordForm({
  today,
  workers,
  workTypes,
  fields,
  crops,
  workTypeSuggestions,
}: Props) {
  const [form, setForm] = useState<WorkRecordFormState>(() =>
    createInitialState(today),
  );
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pending, startTransition] = useTransition();
  const confirmRef = useRef<HTMLDivElement>(null);

  // 確認サマリーはフォーム末尾に出るため、開いたら見える位置まで運ぶ
  useEffect(() => {
    if (confirming) {
      confirmRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [confirming]);

  // 26人を平らに並べると探しにくいので、雇用区分ごとの見出し付きに分ける。
  // 並び順は display_order のまま（区分内の順序も保たれる）。
  const workerGroups = useMemo(() => {
    const groups: { label: string; members: WorkerOption[] }[] = [];
    for (const worker of workers) {
      const label = worker.group ?? "その他";
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

  const workTypeLabel = useMemo(() => {
    const fromMaster = workTypes.find((type) => type.id === form.workTypeId);
    const raw = form.workTypeRaw.trim();
    if (fromMaster && raw) return `${fromMaster.label}（メモ: ${raw}）`;
    if (fromMaster) return fromMaster.label;
    return raw || null;
  }, [workTypes, form.workTypeId, form.workTypeRaw]);

  const fieldLabel =
    fields.find((field) => field.id === form.fieldId)?.label ?? null;

  const cropLabel = crops.find((crop) => crop.id === form.cropId)?.label ?? null;

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
    workTypeLabel ? null : "作業種類",
    cropLabel ? null : "作物",
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
    <div className="flex flex-col gap-4 pb-4">
      <FormCard title="日時" required>
        <label className="block">
          <span className="mb-1.5 block text-sm text-foreground-secondary">
            作業日
          </span>
          <input
            type="date"
            value={form.workDate}
            onChange={(event) => update("workDate", event.target.value)}
            className="control-focus w-full rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground"
          />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-sm text-foreground-secondary">
              開始
            </span>
            <input
              type="time"
              value={form.startTime}
              onChange={(event) => update("startTime", event.target.value)}
              className="control-focus w-full rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm text-foreground-secondary">
              終了
            </span>
            <input
              type="time"
              value={form.endTime}
              onChange={(event) => update("endTime", event.target.value)}
              className="control-focus w-full rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground"
            />
          </label>
        </div>
      </FormCard>

      <FormCard
        title="作業種類"
        hint="マスタが揃うまでは自由入力で構いません。表記ゆれは後でまとめて正規化します。"
      >
        {workTypes.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {workTypes.map((type) => (
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
            workTypes.length > 0 ? "その他（自由入力）" : "例: 防除 / 施肥 / 収穫"
          }
          className="control-focus w-full rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground placeholder:text-foreground-tertiary"
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

      <FormCard title="作物" hint="タップで選択。もう一度タップで解除できます。">
        {crops.length === 0 ? (
          <p className="text-sm text-foreground-tertiary">
            作物マスタが空です。登録すればここに一覧が出ます。
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {crops.map((crop) => (
              <Chip
                key={crop.id}
                selected={form.cropId === crop.id}
                onClick={() =>
                  update("cropId", form.cropId === crop.id ? null : crop.id)
                }
              >
                {crop.label}
              </Chip>
            ))}
          </div>
        )}
      </FormCard>

      <FormCard title="圃場" hint="未設定のまま登録できます。">
        {fields.length === 0 ? (
          <p className="text-sm text-foreground-tertiary">
            圃場マスタが空です。登録すればここに一覧が出ます。
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {fields.map((field) => {
              const selected = form.fieldId === field.id;
              return (
                <button
                  key={field.id}
                  type="button"
                  onClick={() => update("fieldId", selected ? null : field.id)}
                  className={`control-focus pressable flex items-center justify-between rounded-[10px] border px-3.5 py-3 text-left text-[15px] ${
                    selected
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-separator-strong text-foreground hover:bg-surface-secondary"
                  }`}
                >
                  {field.label}
                  {selected && <span aria-hidden>✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </FormCard>

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
              <div className="flex flex-wrap gap-2">
                {group.members.map((worker) => (
                  <Chip
                    key={worker.id}
                    selected={form.selectedWorkerIds.includes(worker.id)}
                    onClick={() => toggleWorker(worker.id)}
                  >
                    {worker.label}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>
      </FormCard>

      <FormCard title="メモ">
        <textarea
          value={form.memo}
          onChange={(event) => update("memo", event.target.value)}
          rows={3}
          placeholder="任意"
          className="control-focus w-full resize-y rounded-[10px] border border-separator-strong bg-surface px-3 py-2.5 text-base text-foreground placeholder:text-foreground-tertiary"
        />
      </FormCard>

      {feedback && (
        <p
          role="status"
          className={`rounded-[10px] px-4 py-3 text-sm ${
            feedback.tone === "success"
              ? "bg-success-bg text-success"
              : "bg-danger-bg text-danger"
          }`}
        >
          {feedback.message}
        </p>
      )}

      {confirming && (
        <div ref={confirmRef} className="surface-card p-5">
          <h2 className="text-[15px] font-semibold text-foreground">
            この内容で登録されます
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <SummaryRow label="作業日" value={form.workDate} />
            <SummaryRow label="時間" value={timeLabel} />
            <SummaryRow label="作業種類" value={workTypeLabel} />
            <SummaryRow label="作物" value={cropLabel} />
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
              className="control-focus pressable flex-1 rounded-full bg-accent px-4 py-3 text-[15px] font-medium text-accent-foreground hover:bg-accent-hover disabled:opacity-50"
            >
              {pending ? "登録中…" : "確定して登録"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={pending}
              className="control-focus pressable rounded-full border border-separator-strong px-4 py-3 text-[15px] font-medium text-foreground-secondary hover:bg-surface-secondary disabled:opacity-50"
            >
              戻る
            </button>
          </div>
        </div>
      )}

      {!confirming && (
        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            setConfirming(true);
          }}
          disabled={!canSubmit}
          className="control-focus pressable above-tabbar sticky rounded-full bg-accent px-4 py-4 text-base font-medium text-accent-foreground shadow-[var(--shadow-elevated)] hover:bg-accent-hover disabled:opacity-40"
        >
          {canSubmit
            ? `内容を確認（${form.selectedWorkerIds.length}件）`
            : "作業者を選択してください"}
        </button>
      )}
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
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`control-focus pressable select-none rounded-full border px-4 py-2.5 text-[15px] ${
        selected
          ? "border-accent bg-accent text-accent-foreground"
          : "border-separator-strong text-foreground hover:bg-surface-secondary"
      }`}
    >
      {children}
    </button>
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
