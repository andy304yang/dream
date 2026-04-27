"use client";

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from "react";
import {
  FileSpreadsheet,
  Upload,
  Download,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from "lucide-react";

type Status = "idle" | "uploading" | "processing" | "polling" | "done" | "error";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// 生成或读取用户唯一 ID（localStorage 持久化）
function getUserId(): string {
  if (typeof window === "undefined") return "";
  let uid = localStorage.getItem("excel_uid");
  if (!uid) {
    uid = "user_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("excel_uid", uid);
  }
  return uid;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [downloadName, setDownloadName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [taskId, setTaskId] = useState("");
  const [pollingCount, setPollingCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [userId] = useState(() => getUserId());

  // 轮询任务状态
  useEffect(() => {
    if (status !== "polling" || !taskId || !userId) return;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/task/${taskId}?user_id=${encodeURIComponent(userId)}`);
        if (!res.ok) throw new Error("查询失败");
        const data = await res.json();

        if (data.status === "done") {
          setDownloadUrl(data.result_url || "");
          setDownloadName(data.filename || `result_${file?.name || "output.xlsx"}`);
          setStatus("done");
        } else if (data.status === "failed") {
          setErrorMsg(data.error || "处理失败，请重试");
          setStatus("error");
        } else {
          // 继续轮询，最多 60 次（约 2 分钟）
          if (pollingCount < 60) {
            setPollingCount((c) => c + 1);
            setTimeout(poll, 2000);
          } else {
            setErrorMsg("处理超时，请稍后重试");
            setStatus("error");
          }
        }
      } catch {
        setErrorMsg("查询任务状态失败，请稍后重试");
        setStatus("error");
      }
    };

    poll();
  }, [status, taskId, userId, pollingCount, file?.name]);

  const acceptFile = (f: File) => {
    const valid = f.name.endsWith(".xlsx") || f.name.endsWith(".xls") || f.name.endsWith(".csv");
    if (!valid) {
      setErrorMsg("仅支持 .xlsx / .xls / .csv 格式");
      return;
    }
    setFile(f);
    setStatus("idle");
    setErrorMsg("");
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setStatus("idle");
    setErrorMsg("");
    setTaskId("");
    setPollingCount(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSubmit = async () => {
    if (!file || !instruction.trim() || !userId) return;
    setStatus("uploading");
    setErrorMsg("");

    try {
      // Step 1: 上传文件
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", userId);

      const uploadRes = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.message || "上传失败");
      }

      const uploadData = await uploadRes.json();
      const tid = uploadData.task_id;
      setTaskId(tid);

      // Step 2: 提交处理指令
      setStatus("processing");
      const processForm = new FormData();
      processForm.append("task_id", tid);
      processForm.append("user_id", userId);
      processForm.append("instruction", instruction);

      const processRes = await fetch(`${API_BASE}/api/process`, {
        method: "POST",
        body: processForm,
      });

      if (!processRes.ok) {
        const err = await processRes.json().catch(() => ({}));
        throw new Error(err.message || "提交处理指令失败");
      }

      // Step 3: 开始轮询状态
      setPollingCount(0);
      setStatus("polling");
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "提交失败，请稍后重试");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setInstruction("");
    setStatus("idle");
    setDownloadUrl("");
    setDownloadName("");
    setErrorMsg("");
    setTaskId("");
    setPollingCount(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const canSubmit = file !== null && instruction.trim().length > 0 && status === "idle";

  const isLoading = status === "uploading" || status === "processing";
  const statusText =
    status === "uploading"
      ? "文件上传中…"
      : status === "processing"
      ? "指令提交中…"
      : status === "polling"
      ? `AI 处理中（${pollingCount * 2}秒）…`
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-800 text-lg">Excel 智能处理</span>
          </div>
          <span className="text-xs text-slate-400">用户: {userId.slice(0, 12)}…</span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-6 py-16">
        <div className="w-full max-w-2xl space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900">上传 Excel，描述你的需求</h1>
            <p className="text-slate-500 text-base">AI 自动处理，完成后即可下载结果文件</p>
          </div>

          {/* Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Step 1 */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">1</span>
                <span className="font-medium text-slate-700">上传文件</span>
              </div>

              {!file ? (
                <div
                  onClick={() => inputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-slate-400" />
                  <p className="text-slate-600 font-medium">点击选择 或 拖拽文件到此处</p>
                  <p className="text-slate-400 text-sm mt-1">支持 .xlsx · .xls · .csv</p>
                  <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                  <FileSpreadsheet className="w-6 h-6 text-green-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={handleRemoveFile} className="p-1 rounded-lg hover:bg-green-100 text-slate-400 hover:text-slate-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Step 2 */}
            <div className="p-6 border-b border-slate-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-semibold flex items-center justify-center">2</span>
                <span className="font-medium text-slate-700">描述修改需求</span>
              </div>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="例如：将 A 列的所有空白单元格填充为 0；把第 3 行到第 10 行按金额从大到小排序…"
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-slate-700 placeholder-slate-400 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Step 3 */}
            <div className="p-6 space-y-3">
              {status !== "done" && status !== "error" && isLoading && (
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{statusText}</span>
                </div>
              )}

              {status !== "done" && status !== "error" && !isLoading && (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                    canSubmit ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  提交处理
                </button>
              )}

              {status === "error" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                  <button
                    onClick={handleReset}
                    className="w-full h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm transition-colors"
                  >
                    重新尝试
                  </button>
                </div>
              )}

              {status === "done" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-medium">处理完成，可以下载了</span>
                  </div>
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    下载结果文件
                  </a>
                  <button
                    onClick={handleReset}
                    className="w-full h-10 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 text-sm transition-colors"
                  >
                    重新处理另一个文件
                  </button>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">文件仅用于本次处理，不会被永久存储</p>
        </div>
      </main>
    </div>
  );
}
