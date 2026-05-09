"use client";

import { useCallback, useState } from "react";
import { Check, Copy, Download, Loader2, Share2 } from "lucide-react";

import type {
  CalculationResult,
  Locale,
  ShareImageSize,
  Theme,
} from "@/types/stock";
import { useShareImage } from "@/hooks/use-share-image";
import { Button } from "@/components/ui/button";

interface ResultActionsProps {
  result: CalculationResult;
  locale?: Locale;
  theme?: Theme;
  /** Image size to generate. Defaults to Instagram portrait. */
  size?: ShareImageSize;
}

type ActionState =
  | { kind: "idle" }
  | { kind: "busy"; action: "save" | "copy" | "share" }
  | { kind: "ok"; action: "save" | "copy" | "share" }
  | { kind: "err"; action: "save" | "copy" | "share"; message: string };

export function ResultActions({
  result,
  locale = "ko",
  theme = "light",
  size = "1080x1350",
}: ResultActionsProps) {
  const {
    generateFromResult,
    download,
    copy,
    share,
    clipboardSupported,
    webShareSupported,
  } = useShareImage({ locale, theme });

  const [state, setState] = useState<ActionState>({ kind: "idle" });

  const labels =
    locale === "ko"
      ? {
          save: "이미지 저장",
          copy: "복사",
          share: "공유",
          saved: "저장됨",
          copied: "복사됨",
          shared: "공유됨",
          retry: "다시 시도",
        }
      : {
          save: "Save",
          copy: "Copy",
          share: "Share",
          saved: "Saved",
          copied: "Copied",
          shared: "Shared",
          retry: "Retry",
        };

  const flashOk = useCallback((action: "save" | "copy" | "share") => {
    setState({ kind: "ok", action });
    window.setTimeout(() => setState({ kind: "idle" }), 1800);
  }, []);

  const flashErr = useCallback(
    (action: "save" | "copy" | "share", err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[result-actions] ${action} failed:`, err);
      setState({ kind: "err", action, message });
      window.setTimeout(() => setState({ kind: "idle" }), 3000);
    },
    []
  );

  const isBusy = state.kind === "busy";

  const handleSave = useCallback(async () => {
    setState({ kind: "busy", action: "save" });
    try {
      const image = await generateFromResult(result, size);
      if (!image) throw new Error("Image generation returned null");
      const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      await download({ filename: `geolgeol-${ts}` }, image);
      flashOk("save");
    } catch (e) {
      flashErr("save", e);
    }
  }, [generateFromResult, download, result, size, flashOk, flashErr]);

  const handleCopy = useCallback(async () => {
    setState({ kind: "busy", action: "copy" });
    try {
      const image = await generateFromResult(result, size);
      if (!image) throw new Error("Image generation returned null");
      const ok = await copy(image);
      if (!ok) throw new Error("Clipboard write returned false");
      flashOk("copy");
    } catch (e) {
      flashErr("copy", e);
    }
  }, [generateFromResult, copy, result, size, flashOk, flashErr]);

  const handleShare = useCallback(async () => {
    setState({ kind: "busy", action: "share" });
    try {
      const image = await generateFromResult(result, size);
      if (!image) throw new Error("Image generation returned null");
      const ok = await share(
        {
          title:
            locale === "ko"
              ? "껄껄 — 그때 살껄..."
              : "GeolGeol — Should've bought...",
          text:
            locale === "ko"
              ? "나의 투자 결과를 확인해보세요!"
              : "Check out my investment result!",
        },
        image
      );
      if (!ok) throw new Error("Share returned false");
      flashOk("share");
    } catch (e) {
      flashErr("share", e);
    }
  }, [generateFromResult, share, result, size, locale, flashOk, flashErr]);

  function statusFor(
    action: "save" | "copy" | "share"
  ): "idle" | "busy" | "ok" | "err" {
    if (state.kind === "idle") return "idle";
    if (state.action !== action) return "idle";
    return state.kind;
  }

  function renderButton(opts: {
    action: "save" | "copy" | "share";
    icon: React.ReactNode;
    label: string;
    okLabel: string;
    onClick: () => void;
    variant: "default" | "outline";
  }) {
    const status = statusFor(opts.action);
    const Icon =
      status === "busy" ? (
        <Loader2 className="animate-spin" />
      ) : status === "ok" ? (
        <Check />
      ) : (
        opts.icon
      );
    return (
      <Button
        type="button"
        variant={opts.variant}
        size="lg"
        onClick={opts.onClick}
        disabled={isBusy}
      >
        {Icon}
        <span>
          {status === "ok"
            ? opts.okLabel
            : status === "err"
              ? labels.retry
              : opts.label}
        </span>
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {renderButton({
        action: "save",
        icon: <Download />,
        label: labels.save,
        okLabel: labels.saved,
        onClick: handleSave,
        variant: "default",
      })}
      {clipboardSupported &&
        renderButton({
          action: "copy",
          icon: <Copy />,
          label: labels.copy,
          okLabel: labels.copied,
          onClick: handleCopy,
          variant: "outline",
        })}
      {webShareSupported &&
        renderButton({
          action: "share",
          icon: <Share2 />,
          label: labels.share,
          okLabel: labels.shared,
          onClick: handleShare,
          variant: "outline",
        })}
      {state.kind === "err" && (
        <p
          role="alert"
          className="basis-full text-center text-xs text-destructive"
        >
          {state.message}
        </p>
      )}
    </div>
  );
}
