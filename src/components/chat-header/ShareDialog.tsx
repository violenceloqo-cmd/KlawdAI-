"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Copy, Check, Link } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { toast } from "@/components/ui/Toast";

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  conversationId: string;
  shared: boolean;
  shareId: string | null;
}

export function ShareDialog({
  open,
  onClose,
  conversationId,
  shared,
  shareId,
}: ShareDialogProps) {
  const [isShared, setIsShared] = useState(shared);
  const [currentShareId, setCurrentShareId] = useState(shareId);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const updateConversation = useAppStore((s) => s.updateConversation);

  const shareUrl = currentShareId
    ? `${window.location.origin}/share/${currentShareId}`
    : "";

  const handleToggle = async (on: boolean) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shared: on }),
      });
      const data = await res.json();
      setIsShared(on);
      setCurrentShareId(data.share_id || null);
      updateConversation(conversationId, {
        shared: on,
        share_id: data.share_id || null,
      });
      toast(on ? "chat shaird" : "chat unshaird", "success");
    } catch {
      toast("fayld 2 updayt sharin", "error");
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast("link copeed", "success");
  };

  return (
    <Modal open={open} onClose={onClose} title="shar conversashun">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-ink-800 dark:text-cream-200">
              Publik link
            </div>
            <div className="text-xs text-ink-400 dark:text-cream-500">
              enywun wif da link ken vew dis conversashun
            </div>
          </div>
          <Toggle
            checked={isShared}
            onChange={handleToggle}
            disabled={loading}
          />
        </div>

        {isShared && shareUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-cream-100 p-3 dark:bg-dark-surface2">
            <Link size={14} className="shrink-0 text-ink-400" />
            <span className="flex-1 truncate text-sm text-ink-600 dark:text-cream-400">
              {shareUrl}
            </span>
            <Button variant="secondary" size="sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
