import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useLoginCarX,
  useRegisterCarX,
  useDeleteCarX,
  useRebuildBannedAccount,
  useGetSavedCredentials,
  useSaveCredentials,
  useGetProfile,
  useInjectCurrency,
  useUnlockMaps,
  useUnlockMapsHouses,
  useUnlockClubs,
  useInjectCars,
  useUnlockStreetPass,
  useUnlockProfileStyle,
  useInjectAll,
  useSafeRepair,
  useGetCars,
  getGetCarsQueryKey,
  useGetCustomCars,
  getGetCustomCarsQueryKey,
  useGetExtremeCars,
  getGetExtremeCarsQueryKey,
  useCheckBan,
} from "@/lib/api-client";
import { CurrencyInputPreset, CarsInjectInputMode } from "@/lib/api-client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  LogOut, DollarSign, Map, Car, Star, Zap, Trophy,
  User, UserPlus, Eye, EyeOff, RefreshCw, CheckCircle2, AlertCircle, Users,
  Trash2, ShieldAlert, ShieldCheck, Copy, Check, Bookmark, Wrench,
  Flame, Layers, Sparkles, PackageCheck, Gift, Smile, ShoppingBag, Fuel, AlertTriangle
} from "lucide-react";

interface CarXSession {
  token: string;
  carxId: string;
  email: string;
  password?: string;
  deviceId?: string;
  uniqueId?: string;
  profileStats?: any;
}

interface ProfileStats {
  silver: number;
  gold: number;
  xp: number;
  level: number;
  cars: number;
  clubs_count: number;
  real_estates_count: number;
  maps_count?: number;
  unlocked_maps?: string[];
  current_car: string;
  current_car_id?: string;
  streetPass: boolean;
  premium: boolean;
  isVerified: boolean;
  isBanned?: boolean;
  banReason?: string;
  name?: string;
  avatars_count?: number;
  frames_count?: number;
  banners_count?: number;
  cars_list?: Array<{ id: string; descId: string; mileage?: number; rating?: number }>;
}

function StatBadge({ label, value, icon, accent, extraBtn }: { label: string; value: string | number; icon: string; accent?: string; extraBtn?: React.ReactNode }) {
  return (
    <div className={`cyber-card rounded-2xl p-3.5 flex flex-col justify-between transition-all hover:scale-[1.02] duration-200 border ${accent || "border-zinc-800"}`}>
      <div className="flex items-center justify-between">
        <span className="text-xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">{icon}</span>
        {extraBtn}
      </div>
      <div className="mt-2.5">
        <div className="text-base sm:text-lg font-mono font-black text-white truncate tracking-tight">
          {typeof value === "number" ? value.toLocaleString() : value}
        </div>
        <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70 animate-pulse" />
          {label}
        </div>
      </div>
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  min,
  max,
  placeholder,
  icon,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className={`text-xs font-chakra font-bold ${accent} flex items-center gap-1.5 uppercase tracking-wider`}>
        <span>{icon}</span> {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        placeholder={placeholder}
        className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3.5 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all font-mono"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange, accent }: { label: string; checked: boolean; onChange: (v: boolean) => void; accent: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer font-chakra ${checked ? `${accent} border-opacity-50 shadow-[0_0_15px_rgba(255,255,255,0.05)]` : "bg-zinc-900/70 border-zinc-800 text-zinc-400 hover:border-zinc-700"}`}
    >
      <span className="text-xs font-bold text-white flex items-center gap-1.5">{label}</span>
      <div className={`w-9 h-5 rounded-full transition-all relative ${checked ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-700"}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </div>
    </button>
  );
}

function BatchField({ label, value, onChange, placeholder, icon, type = "text" }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; icon: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
        <span>{icon}</span>{label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/80 focus:shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all font-mono"
      />
    </div>
  );
}

function BatchForm({ userToken }: { userToken: string }) {
  const { toast } = useToast();
  const savedCredsQuery = useGetSavedCredentials();
  const [count, setCount] = useState("5");
  const [password, setPassword] = useState("CARXMING");

  useEffect(() => {
    if (savedCredsQuery.data?.credentials?.default_password) {
      setPassword(savedCredsQuery.data.credentials.default_password);
    }
  }, [savedCredsQuery.data]);

  const [silver, setSilver] = useState("1000");
  const [gold, setGold] = useState("1000");
  const [xp, setXp] = useState("100");
  const [carsMode, setCarsMode] = useState("all");
  const [carCount, setCarCount] = useState("50");
  const [includeMaps, setIncludeMaps] = useState(true);
  const [includeStreetPass, setIncludeStreetPass] = useState(true);
  const [includeClubs, setIncludeClubs] = useState(true);
  const [includeProfileStyle, setIncludeProfileStyle] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<{ email: string; password?: string; status: string; message?: string }[]>([]);

  const carsQuery = useGetCars({ userToken }, { query: { queryKey: getGetCarsQueryKey({ userToken }), enabled: true } });
  const totalCars = carsQuery.data?.total || 0;

  const CAR_MODES = [
    { v: "all", l: "All Fleet", sub: `${totalCars || "?"} cars` },
    { v: "first50", l: "First 50", sub: "50 cars" },
    { v: "random10", l: "Random 10", sub: "10 cars" },
    { v: "custom", l: "Custom", sub: "set count" },
  ];

  const handleBatch = async () => {
    const n = Math.min(Math.max(Number(count) || 1, 1), 30);
    setRunning(true);
    setResults([]);
    setLogs(["⚙️ [PROTOCOL]: Launching High-Speed Batch Generation..."]);
    setProgress(0);

    try {
      const body = {
        count: n,
        password: password || "CARXMING",
        cash: Number(silver) || 1000,
        gold: Number(gold) || 1000,
        exp: Number(xp) || 100,
        get_all_cars: carsMode === "all" || carsMode === "first50" || carsMode === "random10" || (carsMode === "custom" && Number(carCount) > 0),
        unlock_all: includeMaps,
        unlock_clubs: includeClubs,
        unlock_profile_style: includeProfileStyle,
        inject_bp: includeStreetPass,
        verify: false,
      };

      const res = await fetch("/api/carx/bulk-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.jobId) {
        toast({ title: "Bulk Failed", description: data.message || "Failed to start bulk generation", variant: "destructive" });
        setLogs((l) => [...l, `❌ Error: ${data.message || "Request failed"}`]);
        setRunning(false);
        return;
      }

      const jobId = data.jobId;
      setLogs((l) => [...l, `✅ Batch Thread Initialized! Job #${jobId}`]);

      // Poll status every 1 second
      const interval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/carx/bulk-status/${jobId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
          });
          const statusData = await statusRes.json();
          if (statusData.success && statusData.job) {
            const job = statusData.job;
            setProgress(job.progress || 0);
            if (job.logs) setLogs(job.logs);
            if (job.results) setResults(job.results);

            if (job.status === "completed" || job.status === "cancelled") {
              clearInterval(interval);
              setRunning(false);
              const okCount = (job.results || []).filter((r: any) => r.status === "success").length;
              toast({ title: "Batch Completed!", description: `${okCount}/${n} accounts generated successfully` });
            }
          }
        } catch {
          // ignore poll error
        }
      }, 1000);
    } catch (err: any) {
      toast({ title: "Bulk Failed", description: err.message || "Network error", variant: "destructive" });
      setRunning(false);
    }
  };

  return (
    <div className="cyber-card rounded-3xl p-6 space-y-4 border border-zinc-800">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <div>
            <h3 className="text-xs font-gaming font-bold text-white tracking-widest uppercase">
              BATCH DRIVER FACTORY
            </h3>
            <p className="text-[10px] font-chakra text-zinc-400">
              High-throughput parallel account generation & instant blueprint setup
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
          PARALLEL ENGINE
        </span>
      </div>

      {/* Row 1: count + password */}
      <div className="grid grid-cols-2 gap-3">
        <BatchField label="Accounts Count (max 30)" value={count} onChange={setCount} placeholder="5" icon="👥" type="number" />
        <BatchField label="Default Password" value={password} onChange={setPassword} placeholder="CARXMING" icon="🔑" />
      </div>

      {/* Row 2: Currency */}
      <div>
        <p className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span>💰</span> Starting Currency Engine
        </p>
        <div className="grid grid-cols-3 gap-2">
          <BatchField label="Silver Cash" value={silver} onChange={setSilver} placeholder="1000" icon="🪙" type="number" />
          <BatchField label="Gold Coins" value={gold} onChange={setGold} placeholder="1000" icon="💎" type="number" />
          <BatchField label="EXP Points" value={xp} onChange={setXp} placeholder="100" icon="⚡" type="number" />
        </div>
      </div>

      {/* Row 3: Cars mode */}
      <div>
        <p className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
          <span>🚗</span> Garage Vehicle Package
        </p>
        <div className="grid grid-cols-4 gap-1.5">
          {CAR_MODES.map(({ v, l, sub }) => (
            <button
              key={v}
              onClick={() => setCarsMode(v)}
              className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all border cursor-pointer ${
                carsMode === v ? "bg-purple-600 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] font-bold" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              <span className="text-xs font-chakra">{l}</span>
              <span className={`text-[9px] font-mono mt-0.5 ${carsMode === v ? "text-purple-200" : "text-zinc-500"}`}>{sub}</span>
            </button>
          ))}
        </div>
        <AnimatePresence>
          {carsMode === "custom" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mt-2">
              <BatchField label="Exact Car Count" value={carCount} onChange={setCarCount} placeholder="50" icon="🔢" type="number" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Row 4: Toggles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Toggle label="🗺️ Unlock All 6 Maps" checked={includeMaps} onChange={setIncludeMaps} accent="bg-cyan-500/10 border-cyan-500 text-cyan-300" />
        <Toggle label="🏆 Unlock 52 Houses & 22 Clubs" checked={includeClubs} onChange={setIncludeClubs} accent="bg-purple-500/10 border-purple-500 text-purple-300" />
        <Toggle label="🎟️ Street Pass (⚠️ High Ban Risk)" checked={includeStreetPass} onChange={setIncludeStreetPass} accent="bg-yellow-500/10 border-yellow-500 text-yellow-300" />
        <Toggle label="🎨 20 Avatars, Frames & Banners" checked={includeProfileStyle} onChange={setIncludeProfileStyle} accent="bg-pink-500/10 border-pink-500 text-pink-300" />
      </div>

      <button
        onClick={handleBatch}
        disabled={running}
        className="w-full py-3.5 rounded-xl font-gaming font-bold text-xs tracking-widest uppercase bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-500 text-white hover:from-emerald-500 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] hover:shadow-[0_0_35px_rgba(16,185,129,0.5)] cursor-pointer"
      >
        {running ? (
          <span className="flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            FABRICATING {count} DRIVERS ({progress}%)...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <Users className="w-4 h-4" />
            INITIALIZE {count || "?"} BATCH ACCOUNTS
          </span>
        )}
      </button>

      {/* Live Console Logs */}
      {logs.length > 0 && (
        <div className="bg-black/90 border border-emerald-500/30 rounded-xl p-3 font-mono text-xs max-h-40 overflow-y-auto space-y-1 shadow-inner">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            TELEMETRY BATCH STREAM
          </p>
          {logs.map((log, i) => (
            <div key={i} className="text-zinc-300 text-[11px] leading-relaxed">{log}</div>
          ))}
        </div>
      )}

      {/* Results List */}
      {results.length > 0 && (
        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          <p className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-widest mb-1">
            Accounts Generated — {results.filter(r => r.status === "success").length}/{results.length} Ready
          </p>
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${r.status === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
              {r.status === "success" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              <span className="font-mono flex-1 truncate select-all">{r.email}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(r.email);
                  toast({ title: "Copied Email", description: r.email });
                }}
                className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Copy Email"
              >
                <Copy className="w-3 h-3" />
              </button>
              {r.password && <span className="font-mono text-zinc-400 text-[10px]">{r.password}</span>}
              {r.message && <span className="text-red-400 text-[10px]">{r.message}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoginForm({ userToken, onSuccess }: { userToken: string; onSuccess: (s: CarXSession) => void }) {
  const [mode, setMode] = useState<"login" | "register" | "rebuild" | "delete" | "bulk">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [rebuildStatus, setRebuildStatus] = useState<string[]>([]);
  const { toast } = useToast();

  const savedCredsQuery = useGetSavedCredentials();
  const saveCredsMutation = useSaveCredentials();

  useEffect(() => {
    if (savedCredsQuery.data?.credentials?.default_password && !password) {
      setPassword(savedCredsQuery.data.credentials.default_password);
    }
  }, [savedCredsQuery.data]);

  const login = useLoginCarX({
    mutation: {
      onSuccess: (d) => {
        if (d.isBanned || d.profileStats?.isBanned) {
          toast({
            title: "🚨 Ban Detected on Account!",
            description: d.banReason || d.profileStats?.banReason || "CarX anti-cheat flagged this account as banned or restricted.",
            variant: "destructive"
          });
        }
        onSuccess({
          token: d.token || "",
          carxId: d.userId || d.user_id || "",
          email: d.email || email,
          password: password,
          deviceId: d.deviceId || "",
          uniqueId: d.uniqueId || "",
          profileStats: d.profileStats
        });
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message || (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast({ title: "Login Failed", description: msg || "Invalid credentials", variant: "destructive" });
      },
    },
  });

  const register = useRegisterCarX({
    mutation: {
      onSuccess: (d) => {
        if (d.success === false || !d.token) {
          toast({ title: "Registration Failed", description: d.message || "Failed to create account.", variant: "destructive" });
          return;
        }
        if (d.isBanned || d.profileStats?.isBanned) {
          toast({
            title: "🚨 Ban Detected on Account!",
            description: d.banReason || d.profileStats?.banReason || "CarX anti-cheat flagged this account as banned.",
            variant: "destructive"
          });
        } else {
          toast({ title: "Driver Account Initialized! 🏎️", description: "Starter blueprint applied successfully." });
        }
        onSuccess({
          token: d.token || "",
          carxId: d.userId || d.user_id || "",
          email: d.email || email,
          password: password,
          deviceId: d.deviceId || "",
          uniqueId: d.uniqueId || "",
          profileStats: d.profileStats
        });
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast({ title: "Registration Failed", description: msg || "Try a different email", variant: "destructive" });
      },
    },
  });

  const deleteAcc = useDeleteCarX({
    mutation: {
      onSuccess: (d) => {
        if (d.success) {
          toast({ title: "Account Purged! 🗑️", description: d.message || "CarX account has been completely wiped from server." });
          setPassword("");
        } else {
          toast({ title: "Delete Failed", description: d.message || "Could not delete account. Check credentials.", variant: "destructive" });
        }
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message || (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast({ title: "Delete Failed", description: msg || "Failed to delete account", variant: "destructive" });
      }
    }
  });

  const rebuildAcc = useRebuildBannedAccount({
    mutation: {
      onSuccess: (d) => {
        if (d.success) {
          toast({
            title: "Rebuild Completed! 🔄",
            description: d.message || "Account cloned and rebuilt fresh on CarX cluster!"
          });
          if (d.stepsCompleted) {
            setRebuildStatus(d.stepsCompleted);
          }
          if (d.token) {
            onSuccess({
              token: d.token,
              carxId: d.carxId || "",
              email: email,
              password: password,
            });
          }
        } else {
          toast({
            title: "Rebuild Notice",
            description: d.message || "Rebuild sequence encountered an issue. Profile backup preserved on server.",
            variant: "destructive"
          });
          if (d.stepsCompleted) {
            setRebuildStatus(d.stepsCompleted);
          }
        }
      },
      onError: (err) => {
        const msg = (err as any)?.response?.data?.message || (err as any)?.response?.data?.error || "Rebuild failed";
        toast({ title: "Rebuild Failed", description: msg, variant: "destructive" });
      }
    }
  });

  const handleDelete = () => {
    if (!email || !password) {
      toast({ title: "Missing Information", description: "Please enter account email and password to delete.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`⚠️ Are you sure you want to permanently delete CarX account: ${email}?\nThis uses the bot's fast anonymous & token purge sequence. This cannot be undone!`)) {
      return;
    }
    deleteAcc.mutate({
      data: {
        email,
        password,
        userToken,
        token: userToken,
      }
    });
  };

  const handleRebuild = () => {
    if (!email || !password) {
      toast({ title: "Missing Information", description: "Please enter banned account email and password.", variant: "destructive" });
      return;
    }
    if (!window.confirm(`⚠️ EXPERIMENTAL BAN REBUILD WARNING:\n\n1. Login to banned account & extract full JSON save.\n2. Purge banned account from CarX cluster.\n3. Re-register fresh account with same credentials.\n4. Restore and inject saved JSON back into new account.\n\n⚠️ NOTE: This feature is in active development and may not work for all accounts. Proceed?`)) {
      return;
    }
    setRebuildStatus([
      "Initiating rebuild sequence...",
      "Extracting full profile save JSON from banned account..."
    ]);
    rebuildAcc.mutate({
      data: {
        email,
        password,
        userToken,
        token: userToken,
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (mode === "delete") {
      handleDelete();
      return;
    }

    if (mode === "rebuild") {
      handleRebuild();
      return;
    }

    // Retrieve or generate persistent unique device identifiers
    let storedDeviceIds: { deviceId: string; uniqueId: string } | null = null;
    try {
      const savedIds = localStorage.getItem(`carx_device_ids_${email}`);
      if (savedIds) storedDeviceIds = JSON.parse(savedIds);
    } catch {}

    if (!storedDeviceIds) {
      const randHex = (len: number) => {
        const chars = "0123456789abcdef";
        let str = "";
        for (let i = 0; i < len; i++) {
          str += chars[Math.floor(Math.random() * 16)];
        }
        return str;
      };
      storedDeviceIds = {
        deviceId: randHex(32),
        uniqueId: randHex(64),
      };
      localStorage.setItem(`carx_device_ids_${email}`, JSON.stringify(storedDeviceIds));
    }

    let finalEmail = email.trim();
    if (mode === "register" && finalEmail && !finalEmail.includes("@")) {
      finalEmail = `${finalEmail}@carxming.com`;
    }
    const finalPassword = password.trim() || (mode === "register" ? "CARXMING" : "");

    const payload = {
      email: finalEmail,
      password: finalPassword,
      userToken,
      deviceId: storedDeviceIds.deviceId,
      uniqueId: storedDeviceIds.uniqueId,
    };

    if (mode === "login") {
      login.mutate({ data: payload });
    } else if (mode === "register") {
      register.mutate({ data: payload });
    }
  };

  const handleModeChange = (m: "login" | "register" | "rebuild" | "delete" | "bulk") => {
    setMode(m);
    if (m === "register") {
      if (!password) setPassword("CARXMING");
      if (!email) {
        const rand = Math.floor(100000 + Math.random() * 900000);
        setEmail(`driver${rand}@carxming.com`);
      }
    }
  };

  const isPending = login.isPending || register.isPending || deleteAcc.isPending || rebuildAcc.isPending;

  if (mode === "bulk") {
    return (
      <div>
        <div className="flex gap-1.5 p-1.5 bg-black/60 rounded-2xl mb-4 border border-zinc-800">
          {(["login", "register", "rebuild", "delete", "bulk"] as const).map((m) => (
            <button
              key={m}
              onClick={() => handleModeChange(m)}
              className={`flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl text-xs font-gaming font-bold uppercase tracking-wider transition-all cursor-pointer ${
                mode === m
                  ? (m === "delete"
                      ? "bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                      : m === "rebuild"
                      ? "bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]")
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/40"
              }`}
            >
              {m === "login" ? <User className="w-3.5 h-3.5" /> : m === "register" ? <UserPlus className="w-3.5 h-3.5" /> : m === "rebuild" ? <RefreshCw className="w-3.5 h-3.5" /> : m === "delete" ? <Trash2 className="w-3.5 h-3.5 text-red-400" /> : <Users className="w-3.5 h-3.5" />}
              {m === "login" ? "Login" : m === "register" ? "Register" : m === "rebuild" ? "Rebuild" : m === "delete" ? "Purge" : "Batch"}
            </button>
          ))}
        </div>
        <BatchForm userToken={userToken} />
      </div>
    );
  }

  return (
    <div className="cyber-card rounded-3xl p-6 sm:p-7 border border-zinc-800 space-y-5">
      {/* Mode Navigation Tabs */}
      <div className="flex gap-1.5 p-1.5 bg-black/70 rounded-2xl border border-zinc-800/80">
        {(["login", "register", "rebuild", "delete", "bulk"] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl text-xs font-gaming font-bold uppercase tracking-wider transition-all cursor-pointer ${
              mode === m
                ? (m === "delete"
                    ? "bg-red-600 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-red-400/50"
                    : m === "rebuild"
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] font-extrabold"
                    : m === "register"
                    ? "bg-gradient-to-r from-cyan-500 to-teal-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)] font-extrabold"
                    : "bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-[0_0_20px_rgba(245,158,11,0.4)] font-extrabold")
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50"
            }`}
          >
            {m === "login" ? <User className="w-3.5 h-3.5" /> : m === "register" ? <UserPlus className="w-3.5 h-3.5" /> : m === "rebuild" ? <RefreshCw className="w-3.5 h-3.5" /> : m === "delete" ? <Trash2 className="w-3.5 h-3.5 text-red-400" /> : <Users className="w-3.5 h-3.5" />}
            {m === "login" ? "Login" : m === "register" ? "Register" : m === "rebuild" ? "Rebuild" : m === "delete" ? "Purge" : "Batch"}
          </button>
        ))}
      </div>

      {mode === "delete" && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-red-950/40 border border-red-500/40 rounded-2xl text-xs text-red-300 font-chakra flex items-center gap-2.5"
        >
          <span className="text-base">⚠️</span>
          <div>
            <span className="font-bold">FAST ACCOUNT PURGE:</span> Immediate unbind and token purge protocol to erase account from CarX servers.
          </div>
        </motion.div>
      )}

      {mode === "rebuild" && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-2xl text-xs font-chakra space-y-2 text-amber-200"
        >
          <div className="flex items-center gap-2 text-amber-400 font-gaming font-bold uppercase tracking-wider text-[11px]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>EXPERIMENTAL BAN REBUILD (WORK IN PROCESS)</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-200/90">
            This routine extracts the banned account's complete save JSON, saves a server backup, purges the account, re-registers fresh with identical credentials, and restores the save.
          </p>
          <div className="text-[10px] font-mono text-zinc-400 bg-black/60 p-2 rounded-xl border border-zinc-800 space-y-1">
            <div className="text-red-300 font-bold">⚠️ Notice: In active development — may not work for all accounts due to server UID validation.</div>
            <div className="text-yellow-300">⚠️ Street Pass warning: Street Pass has a high ban detection rate if present.</div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-chakra font-bold text-zinc-400 mb-1.5 flex items-center justify-between uppercase tracking-wider">
            <span>DRIVER IDENTIFIER // EMAIL</span>
            {mode === "register" && (
              <button
                type="button"
                onClick={() => {
                  const rand = Math.floor(100000 + Math.random() * 900000);
                  setEmail(`driver${rand}@carxming.com`);
                }}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 cursor-pointer font-mono font-bold"
              >
                + Auto-Generate
              </button>
            )}
          </label>
          <div className="relative">
            <input
              data-testid="input-carx-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === "register" ? "driver@carxming.com" : "your@email.com"}
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all font-mono"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-chakra font-bold text-zinc-400 mb-1.5 flex items-center justify-between uppercase tracking-wider">
            <span>SECURITY KEY // PASSWORD</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!password) {
                    toast({ title: "No Password", description: "Type a password to save.", variant: "destructive" });
                    return;
                  }
                  saveCredsMutation.mutate({
                    data: { default_password: password }
                  }, {
                    onSuccess: () => {
                      toast({ title: "Password Saved! 🔑", description: "Saved to saved_credentials.json. Persists across updates." });
                    },
                    onError: () => {
                      toast({ title: "Saved to Browser 🔑", description: "Saved to local browser storage." });
                    }
                  });
                  localStorage.setItem("carx_default_password", password);
                }}
                title="Save as permanent default password"
                className="text-[10px] text-emerald-400 hover:text-emerald-300 cursor-pointer font-mono font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
              >
                <Bookmark className="w-3 h-3" />
                <span>Save Password</span>
              </button>
              {mode === "register" && (
                <button
                  type="button"
                  onClick={() => setPassword("CARXMING")}
                  className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer font-mono font-bold"
                >
                  + Default CARXMING
                </button>
              )}
            </div>
          </label>
          <div className="relative">
            <input
              data-testid="input-carx-password"
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all font-mono pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {rebuildStatus.length > 0 && mode === "rebuild" && (
          <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 space-y-1.5 font-mono text-[11px]">
            <div className="text-amber-400 font-bold uppercase text-[10px] flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
              <span>Rebuild Execution Steps:</span>
            </div>
            {rebuildStatus.map((step, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-zinc-300">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{step}</span>
              </div>
            ))}
          </div>
        )}

        {mode === "delete" ? (
          <button
            data-testid="button-carx-delete"
            type="submit"
            disabled={isPending || !email || !password}
            className="w-full py-3.5 rounded-xl font-gaming font-bold text-xs tracking-widest uppercase bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white hover:from-red-500 hover:to-rose-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_25px_rgba(220,38,38,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {deleteAcc.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                PURGING ACCOUNT RECORD...
              </span>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                PERMANENTLY PURGE ACCOUNT
              </>
            )}
          </button>
        ) : mode === "rebuild" ? (
          <button
            data-testid="button-carx-rebuild"
            type="submit"
            disabled={isPending || !email || !password}
            className="w-full py-3.5 rounded-xl font-gaming font-bold text-xs tracking-widest uppercase bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {rebuildAcc.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                EXECUTING REBUILD (IN PROCESS)...
              </span>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                REBUILD BANNED ACCOUNT (EXPERIMENTAL)
              </>
            )}
          </button>
        ) : (
          <div className="space-y-2.5 pt-1">
            <button
              data-testid="button-carx-submit"
              type="submit"
              disabled={isPending || !email || !password}
              className={`w-full py-3.5 rounded-xl font-gaming font-bold text-xs tracking-widest uppercase transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                mode === "login"
                  ? "bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-black hover:from-amber-400 hover:to-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)]"
                  : "bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-black hover:from-cyan-400 hover:to-emerald-300 shadow-[0_0_25px_rgba(6,182,212,0.35)] hover:shadow-[0_0_35px_rgba(6,182,212,0.5)]"
              }`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {mode === "login" ? "LINKING DRIVER TELEMETRY..." : "INITIALIZING DRIVER ACCOUNT..."}
                </span>
              ) : mode === "login" ? (
                "IGNITE ENGINE // LOGIN TO CARX"
              ) : (
                "CREATE ACCOUNT // REGISTER"
              )}
            </button>

            {/* Quick Fast Delete Emergency Option */}
            <button
              type="button"
              disabled={isPending || !email || !password}
              onClick={handleDelete}
              className="w-full py-2 rounded-xl text-[11px] font-chakra font-bold text-red-400/80 hover:text-red-300 hover:bg-red-950/30 border border-red-500/20 transition-all flex items-center justify-center gap-1.5 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteAcc.isPending ? "Purging Account..." : "Fast Purge Account (Using Above Credentials)"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}

function InjectionPanel({ session, userToken, onDisconnect, onUpdateSession }: { session: CarXSession; userToken: string; onDisconnect: () => void; onUpdateSession?: (s: CarXSession) => void }) {
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [currencyPreset, setCurrencyPreset] = useState<string>("step");
  const [customSilver, setCustomSilver] = useState("1000");
  const [customGold, setCustomGold] = useState("1000");
  const [customXp, setCustomXp] = useState("100");

  const [carsMode, setCarsMode] = useState<string>(CarsInjectInputMode.all);
  const [customCarCount, setCustomCarCount] = useState("50");

  const [selectedMap, setSelectedMap] = useState<string>("next");
  const [cosmeticsMode, setCosmeticsMode] = useState<string>("next");
  const [customCosmeticCount, setCustomCosmeticCount] = useState<string>("1");
  const [selectedCosmeticSet, setSelectedCosmeticSet] = useState<number>(1);

  const [tokenToProbe, setTokenToProbe] = useState(session.token || "");
  const [banCheckResult, setBanCheckResult] = useState<{
    checked: boolean;
    isBanned: boolean;
    banReason?: string;
    statusText?: string;
    checkedToken?: string;
    timestamp?: string;
  } | null>(null);
  const [banModalOpen, setBanModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedBanEmail, setCopiedBanEmail] = useState(false);
  const [copiedBanToken, setCopiedBanToken] = useState(false);

  const [results, setResults] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const [activeTier, setActiveTier] = useState<"normal" | "special" | "extreme" | "elite" | "overdrive">("normal");

  const [fleetModalOpen, setFleetModalOpen] = useState(false);
  const [fleetSearch, setFleetSearch] = useState("");

  const [customFleetMode, setCustomFleetMode] = useState<string>("all");
  const [customFleetCarCount, setCustomFleetCarCount] = useState("50");
  const [customFleetModalOpen, setCustomFleetModalOpen] = useState(false);
  const [customFleetSearch, setCustomFleetSearch] = useState("");

  const [extremeFleetMode, setExtremeFleetMode] = useState<string>("all");
  const [extremeFleetCarCount, setExtremeFleetCarCount] = useState("50");
  const [extremeFleetModalOpen, setExtremeFleetModalOpen] = useState(false);
  const [extremeFleetSearch, setExtremeFleetSearch] = useState("");
  const [inspectExtremeCar, setInspectExtremeCar] = useState<any>(null);

  const deleteAcc = useDeleteCarX({
    mutation: {
      onSuccess: (d) => {
        if (d.success) {
          toast({ title: "Account Deleted! 🗑️", description: d.message || "CarX account has been purged successfully." });
          onDisconnect();
        } else {
          toast({ title: "Delete Failed", description: d.message || "Failed to delete account.", variant: "destructive" });
        }
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast({ title: "Delete Failed", description: msg || "Request failed", variant: "destructive" });
      }
    }
  });

  const rebuildDashboardAcc = useRebuildBannedAccount({
    mutation: {
      onSuccess: (d) => {
        if (d.success) {
          toast({
            title: "Rebuild Completed! 🔄",
            description: d.message || "Banned account has been cloned, purged, and re-registered fresh!"
          });
          if (d.token) {
            const updatedSession: CarXSession = {
              ...session,
              token: d.token,
              carxId: d.carxId || session.carxId,
            };
            if (onUpdateSession) onUpdateSession(updatedSession);
            try {
              localStorage.setItem("connectedCarXSession", JSON.stringify(updatedSession));
            } catch {}
          }
          fetchProfile();
        } else {
          toast({
            title: "Rebuild Notice",
            description: d.message || "Rebuild process finished with notes.",
            variant: "destructive"
          });
        }
      },
      onError: (err) => {
        const msg = (err as any)?.response?.data?.message || "Rebuild failed";
        toast({ title: "Rebuild Error", description: msg, variant: "destructive" });
      }
    }
  });

  const handleDeleteCurrentAccount = () => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to permanently delete this CarX account (${session.email})?\nAll progress, cars, and data will be erased forever on CarX servers!`)) {
      return;
    }
    const pw = session.password || localStorage.getItem("carx_default_password") || "CARXMING";
    deleteAcc.mutate({
      data: {
        email: session.email,
        password: pw,
        token: session.token,
        deviceId: session.deviceId,
        userToken
      }
    });
  };

  const handleRebuildCurrentAccount = () => {
    const pw = session.password || localStorage.getItem("carx_default_password") || "CARXMING";
    if (!window.confirm(`⚠️ EXPERIMENTAL BAN REBUILD WARNING:\n\n1. Login to ${session.email} & extract full JSON save.\n2. Purge banned account from CarX cluster.\n3. Re-register fresh account with same credentials.\n4. Restore and inject saved JSON back into new account.\n\n⚠️ NOTE: This feature is in active development and may not work for all accounts. Proceed?`)) {
      return;
    }
    rebuildDashboardAcc.mutate({
      data: {
        email: session.email,
        password: pw,
        token: session.token,
        userToken,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId
      }
    });
  };

  const getProfile = useGetProfile({
    mutation: {
      onSuccess: (d) => {
        if (d.success && d.stats) {
          const isBannedAcc = Boolean(d.stats.isBanned ?? d.isBanned);
          const banReasonText = d.stats.banReason || d.banReason;
          setProfile({
            silver: d.stats.cash !== undefined ? d.stats.cash : 0,
            gold: d.stats.gold !== undefined ? d.stats.gold : 0,
            xp: d.stats.exp !== undefined ? d.stats.exp : 0,
            level: d.stats.level || 1,
            cars: d.stats.cars || d.stats.cars_count || 0,
            clubs_count: d.stats.clubs_count || 0,
            real_estates_count: d.stats.real_estates_count || 0,
            maps_count: d.stats.maps_count !== undefined ? d.stats.maps_count : 0,
            unlocked_maps: d.stats.unlocked_maps || [],
            current_car: d.stats.current_car || "toyotasupra2020",
            current_car_id: d.stats.current_car_id || "",
            streetPass: !!d.stats.street_pass,
            premium: true,
            isVerified: !!d.stats.isVerified,
            isBanned: isBannedAcc,
            banReason: banReasonText,
            name: d.stats.name,
            avatars_count: d.stats.avatars_count !== undefined ? d.stats.avatars_count : 0,
            frames_count: d.stats.frames_count !== undefined ? d.stats.frames_count : 0,
            banners_count: d.stats.banners_count !== undefined ? d.stats.banners_count : 0,
            cars_list: d.stats.cars_list || [],
          });
          if (isBannedAcc) {
            toast({
              title: "🚨 Ban Detected!",
              description: banReasonText || "CarX anti-cheat has flagged or restricted this account.",
              variant: "destructive"
            });
          }
        }
        setLoadingProfile(false);
      },
      onError: () => { setLoadingProfile(false); toast({ title: "Error", description: "Failed to fetch profile", variant: "destructive" }); },
    },
  });

  const injectCurrency = useInjectCurrency({
    mutation: {
      onSuccess: (d) => {
        setResults(r => ({ ...r, currency: { ok: true, msg: d.message || "Done" } }));
        fetchProfile();
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, currency: { ok: false, msg: msg || "Failed" } }));
      },
    },
  });

  const unlockMaps = useUnlockMaps({
    mutation: {
      onSuccess: (d: any) => {
        setResults(r => ({ ...r, maps: { ok: true, msg: d.message || "Done" } }));
        if (d.stats) {
          setProfile(p => p ? ({
            ...p,
            maps_count: d.stats.maps_count !== undefined ? d.stats.maps_count : p.maps_count,
            unlocked_maps: d.stats.unlocked_maps || p.unlocked_maps,
          }) : null);
        }
        fetchProfile();
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, maps: { ok: false, msg: msg || "Failed" } }));
      },
    },
  });

  const unlockClubs = useUnlockClubs({
    mutation: {
      onSuccess: (d) => {
        setResults(r => ({ ...r, clubs: { ok: true, msg: d.message || "Done" } }));
        fetchProfile();
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, clubs: { ok: false, msg: msg || "Failed" } }));
      },
    },
  });

  const unlockMapsHouses = useUnlockMapsHouses({
    mutation: {
      onSuccess: (d: any) => {
        setResults(r => ({ ...r, mapsHouses: { ok: true, msg: d.message || "Maps & Real Estate Unlocked!" } }));
        if (d.stats) {
          setProfile(p => p ? ({
            ...p,
            maps_count: d.stats.maps_count !== undefined ? d.stats.maps_count : p.maps_count,
            unlocked_maps: d.stats.unlocked_maps || p.unlocked_maps,
            clubs_count: d.stats.clubs_count !== undefined ? d.stats.clubs_count : p.clubs_count,
            real_estates_count: d.stats.real_estates_count !== undefined ? d.stats.real_estates_count : p.real_estates_count,
          }) : null);
        }
        toast({ title: "Unlocked!", description: d.message || "All maps & houses unlocked sequentially." });
        fetchProfile();
      },
      onError: (err: any) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, mapsHouses: { ok: false, msg: msg || "Failed to unlock maps & houses" } }));
        toast({ title: "Unlock Failed", description: msg || "Error unlocking maps & houses", variant: "destructive" });
      },
    },
  });

  const checkBan = useCheckBan({
    mutation: {
      onSuccess: (d: any) => {
        const isBanned = Boolean(d.isBanned || d.banned);
        const reason = d.banReason || d.message || (isBanned ? "Account flagged as banned/restricted" : "Active & in good standing");
        setBanCheckResult({
          checked: true,
          isBanned,
          banReason: reason,
          statusText: d.statusText || (isBanned ? "BANNED" : "CLEAN / ACTIVE"),
          checkedToken: tokenToProbe,
          timestamp: new Date().toLocaleTimeString(),
        });
        setBanModalOpen(true);
        if (isBanned) {
          toast({
            title: "🚨 BAN DETECTED!",
            description: reason,
            variant: "destructive",
          });
        } else {
          toast({
            title: "🛡️ ACCOUNT IS CLEAN!",
            description: "No anti-cheat bans or restrictions detected on this active token.",
          });
        }
      },
      onError: (err: any) => {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to probe ban status";
        toast({ title: "Ban Check Failed", description: msg, variant: "destructive" });
      }
    }
  });

  const handleRunBanCheck = (targetToken?: string) => {
    const t = (targetToken || tokenToProbe || session.token || "").trim();
    if (!t) {
      toast({ title: "Token Required", description: "Please enter an active token to test.", variant: "destructive" });
      return;
    }
    checkBan.mutate({
      data: {
        token: t,
        email: session.email,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        userToken
      }
    });
  };

  const injectCars = useInjectCars({
    mutation: {
      onSuccess: (d: any) => {
        setResults(r => ({ ...r, cars: { ok: true, msg: d.message || "Done" } }));
        if (d.stats) {
          setProfile(p => p ? ({
            ...p,
            cars: d.stats.cars || d.stats.cars_count || p.cars,
            current_car: d.stats.current_car || p.current_car,
            current_car_id: d.stats.current_car_id || p.current_car_id,
            cars_list: d.stats.cars_list || p.cars_list,
          }) : null);
        }
        fetchProfile();
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, cars: { ok: false, msg: msg || "Failed" } }));
      },
    },
  });

  const injectCustomCars = useInjectCars({
    mutation: {
      onSuccess: (d: any) => {
        setResults(r => ({ ...r, customCars: { ok: true, msg: d.message || "Done" } }));
        if (d.stats) {
          setProfile(p => p ? ({
            ...p,
            cars: d.stats.cars || d.stats.cars_count || p.cars,
            current_car: d.stats.current_car || p.current_car,
            current_car_id: d.stats.current_car_id || p.current_car_id,
            cars_list: d.stats.cars_list || p.cars_list,
          }) : null);
        }
        fetchProfile();
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, customCars: { ok: false, msg: msg || "Failed" } }));
      },
    },
  });

  const injectCustomPerk = useInjectCars({
    mutation: {
      onSuccess: (d: any, vars: any) => {
        const sType = vars?.data?.service_type || "perk";
        setResults(r => ({ ...r, [sType]: { ok: true, msg: d.message || "Done" } }));
        if (d.stats) {
          setProfile(p => p ? ({
            ...p,
            cash: d.stats.cash !== undefined ? d.stats.cash : p.cash,
            gold: d.stats.gold !== undefined ? d.stats.gold : p.gold,
            level: d.stats.level !== undefined ? d.stats.level : p.level,
            exp: d.stats.exp !== undefined ? d.stats.exp : p.exp,
            cars: d.stats.cars || d.stats.cars_count || p.cars,
            current_car: d.stats.current_car || p.current_car,
            current_car_id: d.stats.current_car_id || p.current_car_id,
            cars_list: d.stats.cars_list || p.cars_list,
          }) : null);
        }
        fetchProfile();
      },
      onError: (err, vars: any) => {
        const sType = vars?.data?.service_type || "perk";
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, [sType]: { ok: false, msg: msg || "Failed" } }));
      },
    },
  });

  const unlockStreetPass = useUnlockStreetPass({
    mutation: {
      onSuccess: (d) => {
        setResults(r => ({ ...r, streetPass: { ok: true, msg: d.message || "Done" } }));
        fetchProfile();
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, streetPass: { ok: false, msg: msg || "Failed" } }));
      },
    },
  });

  const unlockProfileStyle = useUnlockProfileStyle({
    mutation: {
      onSuccess: (d: any) => {
        setResults(r => ({ ...r, profileStyle: { ok: true, msg: d.message || "Avatars & Frames Unlocked!" } }));
        if (d.stats) {
          setProfile(p => p ? ({
            ...p,
            avatar: d.stats.avatar || p.avatar,
            avatars_count: d.stats.avatars_count !== undefined ? d.stats.avatars_count : p.avatars_count,
            frames_count: d.stats.frames_count !== undefined ? d.stats.frames_count : p.frames_count,
            banners_count: d.stats.banners_count !== undefined ? d.stats.banners_count : p.banners_count,
          }) : null);
        }
        fetchProfile();
      },
      onError: (err: any) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, profileStyle: { ok: false, msg: msg || "Failed to unlock avatars" } }));
      },
    },
  });

  const injectAll = useInjectAll({
    mutation: {
      onSuccess: (d: any) => {
        const r = d as { currency?: boolean; maps?: boolean; cars?: number; streetPass?: boolean; message?: string; stats?: any };
        setResults({
          currency: { ok: !!r.currency, msg: "Currency injected" },
          maps: { ok: !!r.maps, msg: "Maps unlocked" },
          cars: { ok: r.cars !== undefined && r.cars > 0, msg: `${r.cars} cars added` },
          streetPass: { ok: !!r.streetPass, msg: r.streetPass ? "Street Pass activated" : "Skipped" },
        });
        if (d.stats) {
          const s = d.stats;
          setProfile(p => p ? ({
            ...p,
            silver: s.cash !== undefined ? s.cash : p.silver,
            gold: s.gold !== undefined ? s.gold : p.gold,
            xp: s.exp !== undefined ? s.exp : p.xp,
            level: s.level || p.level,
            cars: s.cars || s.cars_count || p.cars,
            clubs_count: s.clubs_count || p.clubs_count,
            real_estates_count: s.real_estates_count || p.real_estates_count,
            current_car: s.current_car || p.current_car,
            current_car_id: s.current_car_id || p.current_car_id,
            cars_list: s.cars_list || p.cars_list,
          }) : null);
        }
        toast({ title: "Inject All Complete!", description: r.message });
        fetchProfile();
      },
      onError: (err) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        toast({ title: "Inject All Failed", description: msg, variant: "destructive" });
      },
    },
  });

  const safeRepair = useSafeRepair({
    mutation: {
      onSuccess: (d: any) => {
        setResults(r => ({ ...r, safeRepair: { ok: true, msg: d.message || "Safe Repair Complete!" } }));
        toast({ title: "Safe Repair Complete", description: d.message });
        fetchProfile();
      },
      onError: (err: any) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setResults(r => ({ ...r, safeRepair: { ok: false, msg: msg || "Failed to repair account" } }));
      },
    },
  });

  const carsQuery = useGetCars(
    { userToken },
    { query: { queryKey: getGetCarsQueryKey({ userToken }), enabled: true } }
  );

  const totalCars = carsQuery.data?.total || 98;

  const fetchProfile = () => {
    setLoadingProfile(true);
    getProfile.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        userToken
      }
    });
  };

  // Auto-load profile on mount (same as Replit2 — loads immediately on login/register)
  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.token]);

  const handleInjectCurrency = (forced?: { service_type?: string; cash?: number; gold?: number; exp?: number }) => {
    let service = "custom_resource";
    let cashVal = 1000;
    let goldVal = 1000;
    let expVal = 100;

    if (forced) {
      if (forced.service_type) service = forced.service_type;
      cashVal = forced.cash !== undefined ? forced.cash : 0;
      goldVal = forced.gold !== undefined ? forced.gold : 0;
      expVal = forced.exp !== undefined ? forced.exp : 0;
    } else if (currencyPreset === CurrencyInputPreset.custom) {
      cashVal = Number(customSilver) || 0;
      goldVal = Number(customGold) || 0;
      expVal = Number(customXp) || 0;
    } else if (currencyPreset === "step" || currencyPreset === CurrencyInputPreset.safe || currencyPreset === CurrencyInputPreset.max) {
      cashVal = 1000;
      goldVal = 1000;
      expVal = 100;
    } else if (currencyPreset === CurrencyInputPreset.medium || currencyPreset === "medium") {
      cashVal = 10000;
      goldVal = 5000;
      expVal = 500;
    }

    injectCurrency.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: service,
        cash: cashVal,
        gold: goldVal,
        exp: expVal,
        custom_amount: service === "cash" ? cashVal : (service === "gold" ? goldVal : (service === "exp" ? expVal : undefined)),
        userToken
      },
    });
  };

  const handleInjectCars = () => {
    let service = "get_all_cars";
    let countVal = 10;
    if (carsMode === "mega216") {
      service = "inject_mega_fleet_216";
    } else if (carsMode === "first50") {
      service = "inject_random_cars";
      countVal = 50;
    } else if (carsMode === "random10") {
      service = "inject_random_cars";
      countVal = 10;
    } else if (carsMode === "custom") {
      service = "inject_random_cars";
      countVal = Number(customCarCount) || 10;
    }

    injectCars.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: service,
        random_cars_count: countVal,
        userToken
      }
    });
  };

  const anyPending =
    injectCurrency.isPending || unlockMaps.isPending || unlockClubs.isPending || unlockMapsHouses.isPending ||
    injectCars.isPending || injectCustomCars.isPending || injectCustomPerk.isPending || unlockStreetPass.isPending || unlockProfileStyle.isPending || injectAll.isPending || safeRepair.isPending || checkBan.isPending;

  const customCarsQuery = useGetCustomCars({ query: { queryKey: getGetCustomCarsQueryKey(), enabled: true } });
  const totalCustomCars = customCarsQuery.data?.total || 117;
  const customCarsFleet = (customCarsQuery.data?.cars || []) as Array<{ id: string; descId: string }>;

  const filteredCustomFleet = customCarsFleet.filter(c =>
    (c.descId || "").toLowerCase().includes(customFleetSearch.toLowerCase()) ||
    (c.id || "").toString().includes(customFleetSearch.toLowerCase())
  );

  const CUSTOM_FLEET_MODES = [
    { v: "all", l: `All (${totalCustomCars} Cars)`, sub: `Only ${totalCustomCars} custom fleet cars` },
    { v: "mega216", l: "⚡ 216 Mega Fleet", sub: "117 Custom + 99 Base Cars" },
    { v: "first50", l: "First 50", sub: "50 custom cars" },
    { v: "random10", l: "Random 10", sub: "10 custom cars" },
    { v: "custom", l: "Custom", sub: "Pick count" },
  ];

  const handleInjectCustomFleet = () => {
    let service = "inject_custom_fleet";
    let countVal = totalCustomCars;
    if (customFleetMode === "mega216") {
      service = "inject_mega_fleet_216";
    } else if (customFleetMode === "first50") {
      countVal = 50;
    } else if (customFleetMode === "random10") {
      countVal = 10;
    } else if (customFleetMode === "custom") {
      countVal = Number(customFleetCarCount) || 10;
    }

    injectCustomCars.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: service,
        random_cars_count: countVal,
        userToken
      }
    });
  };

  const handleInjectCustomTreasury = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_custom_treasury",
        userToken
      }
    });
  };

  const handleInjectCustomRealEstate = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_custom_real_estate",
        userToken
      }
    });
  };

  const handleInjectCustomVanity = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_custom_vanity",
        userToken
      }
    });
  };

  const handleInjectCustomArmory = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_custom_armory",
        userToken
      }
    });
  };

  const handleInjectCustomClubs = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_custom_clubs",
        userToken
      }
    });
  };

  const extremeCarsQuery = useGetExtremeCars({ query: { queryKey: getGetExtremeCarsQueryKey(), enabled: true } });
  const totalExtremeCars = extremeCarsQuery.data?.total || 117;
  const extremeCarsFleet = (extremeCarsQuery.data?.cars || []) as Array<{
    id: string;
    descId: string;
    tuningCells?: number;
    vinyls?: number;
    bodyKit?: string;
  }>;

  const filteredExtremeFleet = extremeCarsFleet.filter(c =>
    (c.descId || "").toLowerCase().includes(extremeFleetSearch.toLowerCase()) ||
    (c.id || "").toString().includes(extremeFleetSearch.toLowerCase())
  );

  const EXTREME_FLEET_MODES = [
    { v: "all", l: `All (${totalExtremeCars} Pro Cars)`, sub: `Only ${totalExtremeCars} pro-tuned cars` },
    { v: "mega216", l: "⚡ 216 Mega Fleet", sub: "117 Extreme + 99 Base Cars" },
    { v: "first50", l: "First 50", sub: "50 pro cars" },
    { v: "random10", l: "Random 10", sub: "10 pro cars" },
    { v: "custom", l: "Custom", sub: "Pick count" },
  ];

  const handleInjectExtremeFleet = () => {
    let service = "inject_extreme_fleet";
    let countVal = totalExtremeCars;
    if (extremeFleetMode === "mega216") {
      service = "inject_mega_fleet_216";
    } else if (extremeFleetMode === "first50") {
      countVal = 50;
    } else if (extremeFleetMode === "random10") {
      countVal = 10;
    } else if (extremeFleetMode === "custom") {
      countVal = Number(extremeFleetCarCount) || 10;
    }

    injectCustomCars.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: service,
        random_cars_count: countVal,
        userToken
      }
    });
  };

  const handleInjectExtremeCarSingle = (descId: string) => {
    injectCustomCars.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_car",
        inject_car: descId,
        userToken
      }
    });
  };

  const handleInjectExtremeShopPacks = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_extreme_shop_packs",
        userToken
      }
    });
  };

  const handleInjectExtremeVanity = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_extreme_vanity",
        userToken
      }
    });
  };

  const handleInjectExtremeArmory = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_extreme_armory",
        userToken
      }
    });
  };

  const handleInjectExtremeClubs = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_extreme_clubs",
        userToken
      }
    });
  };

  const handleInjectExtremeCollectables = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_extreme_collectables",
        userToken
      }
    });
  };

  const handleInjectEliteNeon = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_elite_neon",
        userToken
      }
    });
  };

  const handleInjectElitePack = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_elite_pack",
        userToken
      }
    });
  };

  const handleInjectExtremeTreasury = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_extreme_treasury",
        userToken
      }
    });
  };

  const handleInjectFreerideStunts = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_freeride_stunts",
        userToken
      }
    });
  };

  const handleInjectBusinessDeliveries = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_business_deliveries",
        userToken
      }
    });
  };

  const handleInjectFleetOverclock = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_fleet_overclock",
        userToken
      }
    });
  };

  const handleInjectLeaderboardAchievements = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_leaderboard_achievements",
        userToken
      }
    });
  };

  const handleInjectQuestsComplete = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_quests_complete",
        userToken
      }
    });
  };

  const handleInjectMegaFleet216 = () => {
    injectCars.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_mega_fleet_216",
        userToken
      }
    });
  };

  const handleInjectTuningWarehouse = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_tuning_warehouse",
        userToken
      }
    });
  };

  const handleInjectEventCollectables = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_event_collectables",
        userToken
      }
    });
  };

  const handleInjectSyndicateVault = () => {
    injectCustomPerk.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "inject_syndicate_vault",
        userToken
      }
    });
  };

  const handleInjectAddEverything = (tier: "normal" | "special" | "extreme" | "elite" | "overdrive") => {
    const service = tier === "normal"
      ? "inject_everything_normal"
      : tier === "special"
        ? "inject_everything_special"
        : tier === "extreme"
          ? "inject_everything_extreme"
          : "inject_everything_overdrive";

    injectAll.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: service,
        userToken
      }
    });
  };

  const CURRENCY_PRESETS = [
    { v: "step", l: "Safe Step (+1K)", sub: "+1K Cash / +1K Gold / +100 EXP" },
    { v: "medium", l: "Medium (+10K)", sub: "+10K Cash / +5K Gold / +500 EXP" },
    { v: CurrencyInputPreset.custom, l: "Custom", sub: "Set custom increment" },
  ];

  const CAR_MODES = [
    { v: CarsInjectInputMode.all, l: "All (98 Cars)", sub: "All 98 original cars" },
    { v: "mega216", l: "⚡ 216 Mega Fleet", sub: "99 Base + 117 Custom Cars" },
    { v: CarsInjectInputMode.first50, l: "First 50", sub: "50 cars" },
    { v: CarsInjectInputMode.random10, l: "Random 10", sub: "10 cars" },
    { v: CarsInjectInputMode.custom, l: "Custom", sub: "Pick count" },
  ];

  const handleInjectProfileStyle = () => {
    let modeVal = cosmeticsMode;
    let countVal = 1;
    let setId: number | undefined = undefined;

    if (cosmeticsMode === "all") {
      modeVal = "all";
    } else if (cosmeticsMode === "next") {
      modeVal = "next";
      countVal = 1;
    } else if (cosmeticsMode === "custom") {
      modeVal = "custom_count";
      countVal = Math.min(20, Math.max(1, Number(customCosmeticCount) || 1));
    } else if (cosmeticsMode === "specific") {
      modeVal = "specific";
      setId = selectedCosmeticSet;
    }

    unlockProfileStyle.mutate({
      data: {
        token: session.token,
        userId: session.carxId,
        deviceId: session.deviceId,
        uniqueId: session.uniqueId,
        service_type: "unlock_profile_style",
        cosmetic_mode: modeVal,
        custom_count: countVal,
        set_id: setId,
        userToken
      }
    });
  };

  const COSMETICS_MODES = [
    { v: "next", l: "Next (+1)", sub: "One by One" },
    { v: "custom", l: "Custom", sub: "Add X Sets" },
    { v: "specific", l: "Specific", sub: "Pick Set 1-20" },
    { v: "all", l: "All Sets", sub: "20 Avatars & Frames" },
  ];

  const COSMETIC_SETS_OPTIONS = [
    { id: 1, label: "Set 1 (Avatar 1 / Frame 1)" },
    { id: 2, label: "Set 2 (Avatar 2 / Frame 2)" },
    { id: 3, label: "Set 3 (Avatar 3 / Frame 3)" },
    { id: 4, label: "Set 4 (Avatar 4 / Frame 4)" },
    { id: 5, label: "Set 5 (Avatar 5 / Frame 5)" },
    { id: 6, label: "Set 6 (Avatar 6 / Frame 6)" },
    { id: 7, label: "Set 7 (Avatar 7 / Frame 7)" },
    { id: 8, label: "Set 8 (Avatar 8 / Frame 8)" },
    { id: 9, label: "Set 9 (Avatar 9 / Frame 9)" },
    { id: 10, label: "Set 10 (Avatar 10 / Frame 10)" },
    { id: 11, label: "Set 11 (Avatar 11 / Frame 11)" },
    { id: 12, label: "Set 12 (Avatar 12 / Frame 12)" },
    { id: 13, label: "Set 13 (Avatar 13 / Frame 13)" },
    { id: 14, label: "Set 14 (Avatar 14 / Frame 14)" },
    { id: 15, label: "Set 15 (Avatar 15 / Frame 15)" },
    { id: 16, label: "Set 16 (Avatar 16 / Frame 16)" },
    { id: 17, label: "Champion 1 (Golden Cup 1)" },
    { id: 18, label: "Champion 2 (Golden Cup 2)" },
    { id: 19, label: "Champion 3 (Golden Cup 3)" },
    { id: 20, label: "Champion 4 (Crown Champ 4)" },
  ];

  const filteredFleet = (profile?.cars_list || []).filter(c =>
    !fleetSearch || c.descId.toLowerCase().includes(fleetSearch.toLowerCase()) || c.id.includes(fleetSearch)
  );

  return (
    <div className="space-y-4">
      {/* Fleet Modal */}
      {fleetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="cyber-card rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-purple-500/40 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏎️</span>
                <div>
                  <h3 className="text-sm font-gaming font-bold text-white tracking-wide">
                    GARAGE FLEET INSPECTOR ({profile?.cars || 0} CARS)
                  </h3>
                  <p className="text-[11px] font-chakra text-purple-400">
                    Live database of cars parked in account garages
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFleetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-zinc-800 bg-black/40">
              <input
                type="text"
                value={fleetSearch}
                onChange={(e) => setFleetSearch(e.target.value)}
                placeholder="Search car model or slot ID..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-400 font-mono"
              />
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-black/80">
              {filteredFleet.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs font-chakra">
                  No cars matching search filter
                </div>
              ) : (
                filteredFleet.map((c, idx) => (
                  <div
                    key={`${c.id}-${idx}`}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      c.id === profile?.current_car_id || c.descId === profile?.current_car
                        ? "bg-purple-950/40 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                        : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏎️</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white uppercase">{c.descId}</span>
                          {(c.id === profile?.current_car_id || c.descId === profile?.current_car) && (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                              ACTIVE RIDE
                            </span>
                          )}
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500">Slot #{c.id}</span>
                      </div>
                    </div>
                    {c.rating !== undefined && c.rating > 0 && (
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        ⭐ {c.rating} PR
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-[11px] font-chakra text-zinc-500">
              <span>Showing {filteredFleet.length} of {profile?.cars || 0} cars</span>
              <button
                onClick={() => setFleetModalOpen(false)}
                className="text-purple-400 hover:text-purple-300 font-bold uppercase cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {customFleetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="cyber-card rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-cyan-500/40 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/80">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏎️</span>
                <div>
                  <h3 className="text-sm font-gaming font-bold text-white tracking-wide">
                    CUSTOM FLEET INSPECTOR ({totalCustomCars} CARS)
                  </h3>
                  <p className="text-[11px] font-chakra text-cyan-400">
                    Dedicated custom car catalog parsed from uploaded fleet build
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCustomFleetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-zinc-800 bg-black/40">
              <input
                type="text"
                value={customFleetSearch}
                onChange={(e) => setCustomFleetSearch(e.target.value)}
                placeholder="Search custom car model or ID..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-black/80">
              {filteredCustomFleet.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs font-chakra">
                  No cars matching search filter
                </div>
              ) : (
                filteredCustomFleet.map((c, idx) => (
                  <div
                    key={`custom-${c.id}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl border bg-zinc-900/60 border-zinc-800 hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏎️</span>
                      <div>
                        <span className="font-mono text-xs font-bold text-white uppercase">{c.descId}</span>
                        <div className="font-mono text-[10px] text-zinc-500">Fleet ID #{c.id}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                      CUSTOM BUILD
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-[11px] font-chakra text-zinc-500">
              <span>Showing {filteredCustomFleet.length} of {totalCustomCars} cars</span>
              <button
                onClick={() => setCustomFleetModalOpen(false)}
                className="text-cyan-400 hover:text-cyan-300 font-bold uppercase cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {extremeFleetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="cyber-card rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-rose-500/50 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/90">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <h3 className="text-sm font-gaming font-bold text-white tracking-wide">
                    EXTREME PRO-TUNED FLEET ({totalExtremeCars} CARS)
                  </h3>
                  <p className="text-[11px] font-chakra text-rose-400">
                    Stage-5 Pro Builds with Engine Swaps, Turbos & Dyno Cells
                  </p>
                </div>
              </div>
              <button
                onClick={() => setExtremeFleetModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-b border-zinc-800 bg-black/40 flex items-center gap-2">
              <input
                type="text"
                value={extremeFleetSearch}
                onChange={(e) => setExtremeFleetSearch(e.target.value)}
                placeholder="Search extreme car model or ID..."
                className="w-full bg-zinc-900 border border-zinc-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-rose-400 font-mono"
              />
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-black/80">
              {filteredExtremeFleet.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs font-chakra">
                  No cars matching search filter
                </div>
              ) : (
                filteredExtremeFleet.map((c, idx) => (
                  <div
                    key={`extreme-${c.id}-${idx}`}
                    className="flex items-center justify-between p-3 rounded-xl border bg-zinc-900/60 border-zinc-800 hover:border-rose-500/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏎️</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-white uppercase">{c.descId}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                            STAGE-5 PRO
                          </span>
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500 flex items-center gap-2 mt-0.5">
                          <span>Fleet ID #{c.id}</span>
                          <span>·</span>
                          <span className="text-amber-400">{c.tuningCells || 8} Tuning Cells</span>
                          <span>·</span>
                          <span className="text-purple-400">{c.vinyls ? `${c.vinyls} Vinyls` : "Livery"}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={anyPending}
                      onClick={() => handleInjectExtremeCarSingle(c.descId)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 border border-rose-500/50 text-rose-200 hover:text-white font-gaming text-[10px] font-bold uppercase transition-all cursor-pointer"
                    >
                      Inject Car
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between text-[11px] font-chakra text-zinc-500">
              <span>Showing {filteredExtremeFleet.length} of {totalExtremeCars} pro-tuned cars</span>
              <button
                onClick={() => setExtremeFleetModalOpen(false)}
                className="text-rose-400 hover:text-rose-300 font-bold uppercase cursor-pointer"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logged in Header & Profile Dashboard */}
      <div className="cyber-card rounded-3xl p-5 shadow-xl border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">CONNECTED ACCOUNT</div>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm font-bold font-mono text-white select-all">
                {session.email}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (session.email) {
                    navigator.clipboard.writeText(session.email);
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }
                }}
                className="px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[10px] font-mono flex items-center gap-1 border border-zinc-700 transition-all cursor-pointer shadow-sm"
                title="Copy Email"
              >
                {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-zinc-400" />}
                <span className={copiedEmail ? "text-emerald-400 font-bold" : ""}>
                  {copiedEmail ? "Copied!" : "Copy Email"}
                </span>
              </button>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {session.carxId && (
                <div className="text-[11px] font-mono text-zinc-400">
                  CarX ID: <span className="text-amber-400 font-bold select-all">{session.carxId}</span>
                </div>
              )}
              {profile?.isVerified !== undefined && (
                <span className={`text-[10px] font-chakra font-bold px-2 py-0.5 rounded-full border ${
                  profile.isVerified
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                }`}>
                  {profile.isVerified ? "✓ VERIFIED EMAIL" : "⚠️ UNVERIFIED"}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <button
              onClick={() => handleRunBanCheck()}
              disabled={checkBan.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-500/20 to-rose-500/20 hover:from-red-500/30 hover:to-rose-500/30 border border-red-500/40 text-red-300 font-mono text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
              {checkBan.isPending ? "Testing Ban..." : "Test Ban Status"}
            </button>
            <button
              onClick={fetchProfile}
              disabled={loadingProfile}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 font-mono text-[10px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingProfile ? "animate-spin" : ""}`} />
              {loadingProfile ? "Syncing..." : "Sync Stats"}
            </button>
            <button
              onClick={handleDeleteCurrentAccount}
              disabled={deleteAcc.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/30 hover:bg-red-600 border border-red-500/60 text-red-200 font-mono text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-300" />
              {deleteAcc.isPending ? "Deleting..." : "Delete Account"}
            </button>
            <button
              onClick={onDisconnect}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 hover:border-red-400 text-red-400 font-mono text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Disconnect
            </button>
          </div>
        </div>

        {/* Anti-Cheat Ban Alert Banner */}
        {profile?.isBanned && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-rose-950/80 border-2 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.3)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-600 text-white animate-pulse">
                    BANNED / RESTRICTED
                  </span>
                  <span className="text-xs text-red-300 font-bold">CarX Anti-Cheat Detection</span>
                </div>
                <p className="text-xs text-red-300/80 mt-1">
                  {profile.banReason || "This account has been flagged or blocked by CarX active security policies."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={handleRebuildCurrentAccount}
                disabled={rebuildDashboardAcc.isPending}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black rounded-xl text-xs font-gaming font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${rebuildDashboardAcc.isPending ? "animate-spin" : ""}`} />
                {rebuildDashboardAcc.isPending ? "Rebuilding..." : "Rebuild Banned Account"}
              </button>
              <button
                onClick={handleDeleteCurrentAccount}
                disabled={deleteAcc.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {deleteAcc.isPending ? "Purging..." : "Purge Account"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Live Profile Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatBadge
            label="Cash (Silver)"
            value={profile ? `$${profile.silver.toLocaleString()}` : "Loading..."}
            icon="💵"
            accent="border-emerald-500/40 bg-emerald-950/20"
          />
          <StatBadge
            label="Gold Currency"
            value={profile ? `${profile.gold.toLocaleString()}` : "Loading..."}
            icon="🪙"
            accent="border-amber-500/40 bg-amber-950/20"
          />
          <StatBadge
            label="Player Level"
            value={profile ? `Lv ${profile.level}` : "Loading..."}
            icon="⚡"
            accent="border-blue-500/40 bg-blue-950/20"
          />
          <StatBadge
            label="Garage Cars"
            value={profile ? `${profile.cars} Cars` : "Loading..."}
            icon="🏎️"
            accent="border-purple-500/40 bg-purple-950/20"
            extraBtn={
              profile && profile.cars > 0 ? (
                <button
                  type="button"
                  onClick={() => setFleetModalOpen(true)}
                  className="text-[9px] font-chakra font-bold text-purple-400 hover:text-purple-200 underline cursor-pointer"
                >
                  VIEW FLEET
                </button>
              ) : undefined
            }
          />
          <StatBadge
            label="Houses & Clubs"
            value={profile ? `${profile.real_estates_count} Garages · ${profile.clubs_count} Clubs` : "Loading..."}
            icon="🏠"
            accent="border-cyan-500/40 bg-cyan-950/20"
          />
          <StatBadge
            label="Maps Unlocked"
            value={profile ? `${profile.maps_count ?? 0}/6 Maps` : "Loading..."}
            icon="🗺️"
            accent="border-teal-500/40 bg-teal-950/20"
          />
        </div>

        {profile?.current_car && (
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-black/60 border border-purple-500/30 text-xs font-chakra">
            <div className="flex items-center gap-2">
              <span className="text-base">🏎️</span>
              <span className="text-zinc-400">ACTIVE RIDE:</span>
              <strong className="text-purple-300 font-mono uppercase">{profile.current_car}</strong>
              {profile.current_car_id && (
                <span className="text-zinc-500 font-mono">(Slot #{profile.current_car_id})</span>
              )}
            </div>
            <button
              onClick={() => setFleetModalOpen(true)}
              className="text-[11px] font-chakra font-bold text-purple-400 hover:text-purple-300 uppercase underline cursor-pointer"
            >
              Browse Garage Fleet →
            </button>
          </div>
        )}
      </div>

      {/* ── 3-TIER NAVIGATION SWITCHER ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-zinc-950/80 border border-zinc-800 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-gaming font-bold text-white tracking-wider uppercase">INJECTION TIERS</h2>
            <p className="text-[11px] font-chakra text-zinc-400">Select injection category · Normal, Special or Extreme Pro</p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTier("normal")}
            className={`px-4 py-2.5 rounded-xl text-xs font-gaming font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeTier === "normal"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-purple-400/40"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <span>🟢 NORMAL</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-purple-200">98 CARS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTier("special")}
            className={`px-4 py-2.5 rounded-xl text-xs font-gaming font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeTier === "special"
                ? "bg-gradient-to-r from-amber-600 to-pink-600 text-white shadow-[0_0_20px_rgba(245,158,11,0.4)] border border-amber-400/40"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <span>⭐ SPECIAL</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-amber-200">117 FLEET</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTier("extreme")}
            className={`px-4 py-2.5 rounded-xl text-xs font-gaming font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeTier === "extreme"
                ? "bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 text-white shadow-[0_0_25px_rgba(239,68,68,0.5)] border border-rose-400/40 animate-pulse"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <span>🔥 EXTREME</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-rose-200">STAGE-5 PRO</span>
          </button>

          <button
            type="button"
            data-testid="tab-elite-pack"
            onClick={() => setActiveTier("elite")}
            className={`px-4 py-2.5 rounded-xl text-xs font-gaming font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeTier === "elite"
                ? "bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 text-black font-black shadow-[0_0_25px_rgba(6,182,212,0.5)] border border-cyan-300"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <span>👑 ELITE PACK</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-cyan-200">ALL UNLOCKS</span>
          </button>

          <button
            type="button"
            data-testid="tab-overdrive-tier"
            onClick={() => setActiveTier("overdrive")}
            className={`px-4 py-2.5 rounded-xl text-xs font-gaming font-bold tracking-wider uppercase transition-all cursor-pointer flex items-center gap-2 ${
              activeTier === "overdrive"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-black font-black shadow-[0_0_25px_rgba(245,158,11,0.6)] border border-amber-300 animate-pulse"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            <span>☣️ OVERDRIVE</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/50 font-bold">⚠️ HAS FLAWS</span>
          </button>
        </div>
      </div>

      {/* ── NORMAL TIER SECTION ── */}
      {activeTier === "normal" && (
        <div className="space-y-4">
          {/* Normal Hero: Inject Add Everything */}
          <div className="cyber-card rounded-3xl p-6 border-2 border-purple-500/50 bg-gradient-to-br from-purple-950/40 via-zinc-950 to-indigo-950/40 shadow-[0_0_35px_rgba(168,85,247,0.25)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-xl">
                  🚀
                </div>
                <div>
                  <h3 className="text-sm font-gaming font-black text-white tracking-wider uppercase flex items-center gap-2">
                    <span>INJECT ADD EVERYTHING (NORMAL TIER)</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
                      ALL-IN-ONE
                    </span>
                  </h3>
                  <p className="text-xs font-chakra text-purple-300/80">
                    98 Base Cars · All 6 World Maps · 20 Racing Clubs · Profile Style & Cosmetics · Safe Currency (+50K Cash, +5K Gold, 93,060 EXP Lv. 50)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase shrink-0">
                🛡️ 100% Anti-Ban Safe · No StreetPass
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-300 leading-relaxed">
              Injects everything available in the Normal section at once: all 98 standard vehicles into raw inventory, beats and unlocks all 20 Racing Clubs, unlocks full cosmetics sets, and applies safe modest currency with exactly 93,060 EXP (Level 50 cap).
            </p>

            <button
              onClick={() => handleInjectAddEverything("normal")}
              disabled={anyPending}
              className="w-full py-4 rounded-2xl font-gaming font-black text-xs sm:text-sm tracking-widest uppercase bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 hover:from-purple-400 hover:to-indigo-400 text-white disabled:opacity-40 transition-all shadow-[0_0_25px_rgba(168,85,247,0.35)] hover:shadow-[0_0_40px_rgba(168,85,247,0.55)] cursor-pointer"
            >
              {injectAll.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> INJECTING NORMAL EVERYTHING...
                </span>
              ) : (
                "🚀 INJECT ADD EVERYTHING (NORMAL TIER)"
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Currency Module */}
        <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">RESOURCE ENGINE</h3>
                  <p className="text-[10px] font-chakra text-amber-300/80">Cash · Gold · EXP</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                Anti-Ban Safe
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Inject safe increments directly to account database. Rapid 1-click steppers for fast top-ups.
            </p>

            {/* Quick 1-Click Steppers */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={anyPending}
                onClick={() => handleInjectCurrency({ service_type: "cash", cash: 1000 })}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-bold transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:scale-[1.02]"
              >
                <span className="text-xs font-mono font-black">💵 +1,000</span>
                <span className="text-[9px] font-chakra text-emerald-400/90 uppercase font-bold mt-0.5">Cash</span>
              </button>
              <button
                type="button"
                disabled={anyPending}
                onClick={() => handleInjectCurrency({ service_type: "gold", gold: 1000 })}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 text-amber-300 font-bold transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:scale-[1.02]"
              >
                <span className="text-xs font-mono font-black">🪙 +1,000</span>
                <span className="text-[9px] font-chakra text-amber-400/90 uppercase font-bold mt-0.5">Gold</span>
              </button>
              <button
                type="button"
                disabled={anyPending}
                onClick={() => handleInjectCurrency({ service_type: "exp", exp: 100 })}
                className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 font-bold transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:scale-[1.02]"
              >
                <span className="text-xs font-mono font-black">⚡ +100</span>
                <span className="text-[9px] font-chakra text-cyan-400/90 uppercase font-bold mt-0.5">EXP</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {CURRENCY_PRESETS.map(({ v, l, sub }) => (
                <button
                  key={v}
                  onClick={() => setCurrencyPreset(v)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all border cursor-pointer ${
                    currencyPreset === v
                      ? "bg-amber-500 border-amber-400 text-black font-bold shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-xs font-chakra">{l}</span>
                  <span className={`text-[9px] font-mono mt-0.5 ${currencyPreset === v ? "text-black/80 font-bold" : "text-zinc-500"}`}>{sub}</span>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {currencyPreset === CurrencyInputPreset.custom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-2 pt-1"
                >
                  <NumInput label="Cash (Silver)" value={customSilver} onChange={setCustomSilver} min={0} max={1000000} placeholder="1000" icon="🪙" accent="text-zinc-300" />
                  <NumInput label="Gold Coins" value={customGold} onChange={setCustomGold} min={0} max={100000} placeholder="1000" icon="💰" accent="text-amber-400" />
                  <NumInput label="Player EXP" value={customXp} onChange={setCustomXp} min={0} max={100000} placeholder="100" icon="⚡" accent="text-cyan-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              data-testid="button-inject-currency"
              onClick={() => handleInjectCurrency()}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)]"
            >
              {injectCurrency.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING RESOURCES...</span>
              ) : "DEPLOY STEP BUNDLE (+1K CASH, +1K GOLD, +100 EXP)"}
            </button>
            {results.currency && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.currency.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.currency.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.currency.msg}
              </div>
            )}
          </div>
        </div>
                        {/* Maps & Real Estate Module */}
        <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Map className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">WORLD MAP & REAL ESTATE</h3>
                  <p className="text-[10px] font-chakra text-cyan-300/80">6 Zones · 52 Garages · 22 Clubs</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                1-Click Unlock
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Unlocks Mountain, Sunset, Port, Suburb & Midtown world map zones plus all 52 player houses and 22 clubs one-by-one under the hood without slot corruption.
            </p>

            <div className="grid grid-cols-2 gap-2 py-1">
              <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">World Maps</div>
                <div className="text-base font-black text-cyan-300 font-mono mt-0.5">
                  {profile ? `${profile.maps_count ?? 0} / 6 Active` : "6 Zones"}
                </div>
              </div>
              <div className="bg-black/60 border border-purple-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">Garages & Clubs</div>
                <div className="text-base font-black text-purple-300 font-mono mt-0.5">
                  {profile ? `${profile.real_estates_count}H · ${profile.clubs_count}C` : "52H · 22C"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              data-testid="button-unlock-maps-houses"
              onClick={() => unlockMapsHouses.mutate({
                data: {
                  token: session.token,
                  userId: session.carxId,
                  deviceId: session.deviceId,
                  uniqueId: session.uniqueId,
                  service_type: "unlock_maps_houses",
                  unlock_houses: true,
                  unlock_maps: true,
                  userToken
                }
              })}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              {unlockMapsHouses.isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING MAPS & HOUSES...
                </span>
              ) : (
                "🗺️ UNLOCK ALL MAPS & HOUSES (1-CLICK)"
              )}
            </button>
            {results.mapsHouses && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.mapsHouses.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.mapsHouses.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.mapsHouses.msg}
              </div>
            )}
          </div>
        </div>

        {/* Custom Real Estate Portfolio Section */}
        <div className="cyber-card cyber-card-glow-blue rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-blue-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Bookmark className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CUSTOM REAL ESTATE PORTFOLIO (52 ESTATES)</h3>
                  <p className="text-[10px] font-chakra text-blue-300/80">52 Estates · All Garages & Slots Unlocked</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold uppercase">
                52 HOUSES
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Unlocks all 52 luxury apartments across Midtown, Mountain, Speedway, and Industrial with 100% purchased status and active garage slots.
            </p>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>Midtown Apartments:</span>
                <span className="text-blue-400 font-bold">12 Properties</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Mountain Villas:</span>
                <span className="text-blue-400 font-bold">19 Properties</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Speedway & Suburb:</span>
                <span className="text-blue-400 font-bold">15 Properties</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Industrial Condos:</span>
                <span className="text-blue-400 font-bold">6 Properties</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleInjectCustomRealEstate}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] cursor-pointer"
            >
              {injectCustomPerk.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING ESTATES...</span>
              ) : "🏠 UNLOCK ALL 52 REAL ESTATES & SLOTS"}
            </button>
            {results.inject_custom_real_estate && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_custom_real_estate.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.inject_custom_real_estate.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.inject_custom_real_estate.msg}
              </div>
            )}
          </div>
        </div>

        {/* Vehicles Injection */}
        <div className="cyber-card cyber-card-glow-purple rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-purple-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <Car className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">VEHICLE FLEET DECK (98 CARS)</h3>
                  <p className="text-[10px] font-chakra text-purple-300/80">Original 98 Meta Cars · Pro Tunes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFleetModalOpen(true)}
                className="text-[9px] font-chakra font-bold text-purple-400 hover:text-purple-200 underline cursor-pointer uppercase"
              >
                Browse Fleet ({profile?.cars || 0}) →
              </button>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Injects the original 98 CarX meta vehicles into account garage slots with verified CarX physics & ratings.
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {CAR_MODES.map(({ v, l, sub }) => (
                <button
                  key={v}
                  onClick={() => setCarsMode(v)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all border cursor-pointer ${
                    carsMode === v
                      ? "bg-purple-600 border-purple-400 text-white font-bold shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-xs font-chakra">{l}</span>
                  <span className={`text-[9px] font-mono mt-0.5 ${carsMode === v ? "text-purple-200" : "text-zinc-500"}`}>{sub}</span>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {carsMode === CarsInjectInputMode.custom && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-1"
                >
                  <NumInput
                    label="Car Count to Inject"
                    value={customCarCount}
                    onChange={setCustomCarCount}
                    min={1}
                    max={totalCars || 89}
                    placeholder="50"
                    icon="🏎️"
                    accent="text-purple-300"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              data-testid="button-inject-cars"
              onClick={handleInjectCars}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-500 hover:from-purple-500 hover:to-fuchsia-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] cursor-pointer"
            >
              {injectCars.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING VEHICLES...</span>
              ) : carsMode === "mega216" ? "⚡ INJECT 216 MEGA FLEET TO GARAGE (99 BASE + 117 CUSTOM)" : carsMode === CarsInjectInputMode.all ? "🚗 INJECT ALL 98 CARS TO GARAGE" : "🚗 INJECT CARS TO GARAGE"}
            </button>
            {results.cars && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.cars.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.cars.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.cars.msg}
              </div>
            )}
          </div>
        </div>
            {/* Custom Racing Clubs Syndicate Section */}
        <div className="cyber-card cyber-card-glow-teal rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-teal-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CUSTOM CLUBS SYNDICATE (20 CLUBS)</h3>
                  <p className="text-[10px] font-chakra text-teal-300/80">20 Racing Clubs · Elite Boss Defeats & Records</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold uppercase">
                20 CLUBS
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Unlocks complete membership and boss challenge progress for all 20 street clubs (Burnout Rangers, Spitfire, Emeralds, White Tigers, etc.).
            </p>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>Tier 1-3 Clubs:</span>
                <span className="text-teal-400 font-bold">White Tigers, Pythons, Spitfire</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tier 4-5 Clubs:</span>
                <span className="text-teal-400 font-bold">Burnout Rangers, Black Lotus, Emeralds</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleInjectCustomClubs}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] cursor-pointer"
            >
              {injectCustomPerk.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING CLUBS...</span>
              ) : "🏆 UNLOCK ALL 20 RACING CLUBS"}
            </button>
            {results.inject_custom_clubs && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_custom_clubs.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.inject_custom_clubs.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.inject_custom_clubs.msg}
              </div>
            )}
          </div>
        </div>
            {/* Cosmetics Module */}
        <div className="cyber-card cyber-card-glow-pink rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-pink-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">DRIVER IDENTITY & STYLE</h3>
                  <p className="text-[10px] font-chakra text-pink-300/80">Avatars · Frames · Banners</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-bold uppercase">
                {profile ? `${profile.avatars_count ?? 0}/20 Sets` : "20 Sets"}
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Inject custom profile avatars, frames & banners one by one like cars or unlock all 20 sets at once.
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {COSMETICS_MODES.map(({ v, l, sub }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCosmeticsMode(v)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all border cursor-pointer ${
                    cosmeticsMode === v
                      ? "bg-pink-600 border-pink-400 text-white font-bold shadow-[0_0_15px_rgba(236,72,153,0.3)]"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-xs font-chakra">{l}</span>
                  <span className={`text-[9px] font-mono mt-0.5 ${cosmeticsMode === v ? "text-pink-200" : "text-zinc-500"}`}>{sub}</span>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {cosmeticsMode === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-1"
                >
                  <NumInput
                    label="Sets Count to Unlock"
                    value={customCosmeticCount}
                    onChange={setCustomCosmeticCount}
                    min={1}
                    max={20}
                    placeholder="1"
                    icon="🎨"
                    accent="text-pink-300"
                  />
                </motion.div>
              )}

              {cosmeticsMode === "specific" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden space-y-1 pt-1"
                >
                  <label className="text-[11px] font-chakra font-bold text-zinc-400 flex items-center justify-between uppercase tracking-wider">
                    <span>🎯 Choose Specific Set</span>
                  </label>
                  <select
                    value={selectedCosmeticSet}
                    onChange={(e) => setSelectedCosmeticSet(Number(e.target.value))}
                    className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500/80 transition-all font-mono cursor-pointer"
                  >
                    {COSMETIC_SETS_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id} className="bg-zinc-900 text-white">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              data-testid="button-unlock-avatars"
              onClick={handleInjectProfileStyle}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(236,72,153,0.25)] hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]"
            >
              {unlockProfileStyle.isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {cosmeticsMode === "next" ? "UNLOCKING NEXT SET..." : "INJECTING COSMETICS..."}
                </span>
              ) : (
                cosmeticsMode === "next"
                  ? "👤 UNLOCK NEXT AVATAR & FRAME (+1)"
                  : cosmeticsMode === "custom"
                  ? `👤 INJECT ${customCosmeticCount || 1} SETS (ONE-BY-ONE)`
                  : cosmeticsMode === "specific"
                  ? `👤 EQUIP SET #${selectedCosmeticSet}`
                  : "👤 UNLOCK ALL 20 AVATARS & FRAMES"
              )}
            </button>
            {results.profileStyle && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.profileStyle.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.profileStyle.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.profileStyle.msg}
              </div>
            )}
          </div>
        </div>
            {/* Safe Repair Module */}
        <div className="cyber-card cyber-card-glow-emerald rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-emerald-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">PIT-STOP SAFE REPAIR</h3>
                  <p className="text-[10px] font-chakra text-emerald-300/80">Fix "Checking Profile" · Reset Slot Tables</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                Diagnostic
              </span>
            </div>
            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Repairs corrupt garage slots, unbinds conflicting ghost cars, and repairs game account tables back to safe verified database defaults.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              data-testid="button-safe-repair"
              onClick={() => {
                if (window.confirm("🩹 WARNING: This will reset your garage to 1 starting car, beat all clubs, and repair all slot tables to 100% valid game database values. Use this if your game is stuck on 'Checking profile'. Proceed?")) {
                  safeRepair.mutate({
                    data: {
                      token: session.token,
                      userId: session.carxId,
                      deviceId: session.deviceId,
                      uniqueId: session.uniqueId,
                      service_type: "safe_repair",
                      userToken
                    }
                  });
                }
              }}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer"
            >
              {safeRepair.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> REPAIRING ACCOUNT...</span>
              ) : "🔧 FIX STUCK / SAFE REPAIR"}
            </button>
            {results.safeRepair && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.safeRepair.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.safeRepair.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.safeRepair.msg}
              </div>
            )}
          </div>
        </div>
          </div>
        </div>
      )}

      {/* ── SPECIAL TIER SECTION ── */}
      {activeTier === "special" && (
        <div className="space-y-4">
          {/* Special Hero: Inject Add Everything */}
          <div className="cyber-card rounded-3xl p-6 border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/40 via-zinc-950 to-pink-950/40 shadow-[0_0_35px_rgba(245,158,11,0.25)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl">
                  ⭐
                </div>
                <div>
                  <h3 className="text-sm font-gaming font-black text-white tracking-wider uppercase flex items-center gap-2">
                    <span>INJECT ADD EVERYTHING (SPECIAL TIER)</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                      CUSTOM FLEET
                    </span>
                  </h3>
                  <p className="text-xs font-chakra text-amber-300/80">
                    117 Custom Fleet Cars · All 6 World Maps · 115+ Vanity Vault · 99x Tires & Armory · 20 Clubs · Safe Currency (+50K / +5K / 93,060 EXP)
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase shrink-0">
                🛡️ Safe Profile Sync · No StreetPass
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-300 leading-relaxed">
              Injects all exclusive Custom Fleet perks: 117 custom vehicles, 115+ rare championship and event vanity plates/avatars, 99x tire sets, full tuning armory stock, 20 racing clubs, and safe modest bank additions with exact 93,060 EXP (Lv. 50).
            </p>

            <button
              onClick={() => handleInjectAddEverything("special")}
              disabled={anyPending}
              className="w-full py-4 rounded-2xl font-gaming font-black text-xs sm:text-sm tracking-widest uppercase bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-black disabled:opacity-40 transition-all shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_40px_rgba(245,158,11,0.55)] cursor-pointer"
            >
              {injectAll.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> INJECTING SPECIAL EVERYTHING...
                </span>
              ) : (
                "⭐ INJECT ADD EVERYTHING (SPECIAL TIER)"
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Custom Vehicles Fleet Injection Section */}
        <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Car className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CUSTOM FLEET DECK ({totalCustomCars} CARS)</h3>
                  <p className="text-[10px] font-chakra text-cyan-300/80">Special Extended Fleet · Verified Pro Builds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomFleetModalOpen(true)}
                className="text-[9px] font-chakra font-bold text-cyan-400 hover:text-cyan-200 underline cursor-pointer uppercase"
              >
                Browse Fleet ({totalCustomCars}) →
              </button>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Injects the dedicated {totalCustomCars}-car custom fleet into your account while keeping all existing cars completely intact.
            </p>

            <div className="grid grid-cols-2 gap-1.5">
              {CUSTOM_FLEET_MODES.map(({ v, l, sub }) => (
                <button
                  key={v}
                  onClick={() => setCustomFleetMode(v)}
                  className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all border cursor-pointer ${
                    customFleetMode === v
                      ? "bg-cyan-600 border-cyan-400 text-white font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  }`}
                >
                  <span className="text-xs font-chakra">{l}</span>
                  <span className={`text-[9px] font-mono mt-0.5 ${customFleetMode === v ? "text-cyan-200" : "text-zinc-500"}`}>{sub}</span>
                </button>
              ))}
            </div>

            <AnimatePresence>
              {customFleetMode === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden pt-1"
                >
                  <NumInput
                    label="Car Count to Inject"
                    value={customFleetCarCount}
                    onChange={setCustomFleetCarCount}
                    min={1}
                    max={totalCustomCars}
                    placeholder="50"
                    icon="🏎️"
                    accent="text-cyan-300"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              data-testid="button-inject-custom-fleet"
              onClick={handleInjectCustomFleet}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-500 hover:from-cyan-500 hover:to-teal-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              {injectCustomCars.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING VEHICLES...</span>
              ) : customFleetMode === "mega216" ? "⚡ INJECT 216 MEGA FLEET TO GARAGE (117 CUSTOM + 99 BASE)" : customFleetMode === "all" ? `🚗 INJECT ONLY ${totalCustomCars} CUSTOM FLEET CARS` : "🚗 INJECT CUSTOM CARS TO GARAGE"}
            </button>
            {results.customCars && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.customCars.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.customCars.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.customCars.msg}
              </div>
            )}
          </div>
        </div>
                        {/* Maps & Real Estate Module */}
        <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Map className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">WORLD MAP & REAL ESTATE</h3>
                  <p className="text-[10px] font-chakra text-cyan-300/80">6 Zones · 52 Garages · 22 Clubs</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                1-Click Unlock
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Unlocks Mountain, Sunset, Port, Suburb & Midtown world map zones plus all 52 player houses and 22 clubs one-by-one under the hood without slot corruption.
            </p>

            <div className="grid grid-cols-2 gap-2 py-1">
              <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">World Maps</div>
                <div className="text-base font-black text-cyan-300 font-mono mt-0.5">
                  {profile ? `${profile.maps_count ?? 0} / 6 Active` : "6 Zones"}
                </div>
              </div>
              <div className="bg-black/60 border border-purple-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">Garages & Clubs</div>
                <div className="text-base font-black text-purple-300 font-mono mt-0.5">
                  {profile ? `${profile.real_estates_count}H · ${profile.clubs_count}C` : "52H · 22C"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              data-testid="button-unlock-maps-houses"
              onClick={() => unlockMapsHouses.mutate({
                data: {
                  token: session.token,
                  userId: session.carxId,
                  deviceId: session.deviceId,
                  uniqueId: session.uniqueId,
                  service_type: "unlock_maps_houses",
                  unlock_houses: true,
                  unlock_maps: true,
                  userToken
                }
              })}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              {unlockMapsHouses.isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING MAPS & HOUSES...
                </span>
              ) : (
                "🗺️ UNLOCK ALL MAPS & HOUSES (1-CLICK)"
              )}
            </button>
            {results.mapsHouses && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.mapsHouses.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.mapsHouses.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.mapsHouses.msg}
              </div>
            )}
          </div>
        </div>

        {/* Custom Fleet Treasury Section */}
        <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CUSTOM FLEET TREASURY (SAFE PRESET)</h3>
                  <p className="text-[10px] font-chakra text-amber-300/80">Full Profile Bank · Level 50 EXP (93,060)</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                MAX TIER
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Injects the full custom bank vault directly: +50,000 Soft Cash, +5,000 Gold, and safe 93,060 EXP (Lv. 50).
            </p>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>Soft Cash:</span>
                <span className="text-emerald-400 font-bold">+50,000</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Gold Coins:</span>
                <span className="text-amber-400 font-bold">+5,000</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Driver EXP:</span>
                <span className="text-purple-400 font-bold">93,060 (Lv. 50)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleInjectCustomTreasury}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-pointer"
            >
              {injectCustomPerk.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING TREASURY...</span>
              ) : "💰 INJECT SAFE CASH, GOLD & LV. 50 (93,060 EXP)"}
            </button>
            {results.inject_custom_treasury && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_custom_treasury.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.inject_custom_treasury.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.inject_custom_treasury.msg}
              </div>
            )}
          </div>
        </div>

        {/* Custom Real Estate Portfolio Section */}
        <div className="cyber-card cyber-card-glow-blue rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-blue-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  <Bookmark className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CUSTOM REAL ESTATE PORTFOLIO (52 ESTATES)</h3>
                  <p className="text-[10px] font-chakra text-blue-300/80">52 Estates · All Garages & Slots Unlocked</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold uppercase">
                52 HOUSES
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Unlocks all 52 luxury apartments across Midtown, Mountain, Speedway, and Industrial with 100% purchased status and active garage slots.
            </p>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>Midtown Apartments:</span>
                <span className="text-blue-400 font-bold">12 Properties</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Mountain Villas:</span>
                <span className="text-blue-400 font-bold">19 Properties</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Speedway & Suburb:</span>
                <span className="text-blue-400 font-bold">15 Properties</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Industrial Condos:</span>
                <span className="text-blue-400 font-bold">6 Properties</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleInjectCustomRealEstate}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(59,130,246,0.25)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] cursor-pointer"
            >
              {injectCustomPerk.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING ESTATES...</span>
              ) : "🏠 UNLOCK ALL 52 REAL ESTATES & SLOTS"}
            </button>
            {results.inject_custom_real_estate && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_custom_real_estate.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.inject_custom_real_estate.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.inject_custom_real_estate.msg}
              </div>
            )}
          </div>
        </div>

        {/* Custom Vanity & Battle Pass Vault Section */}
        <div className="cyber-card cyber-card-glow-purple rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-fuchsia-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-fuchsia-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CUSTOM VANITY VAULT (115+ REWARDS)</h3>
                  <p className="text-[10px] font-chakra text-fuchsia-300/80">Lunar, Halloween & Championship Plates · 1-18 Avatars</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 font-bold uppercase">
                115+ ITEMS
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Unlocks all 115+ event numberplates, special festival liveries, tire sidewall lettering, and complete Avatars, Banners, and Frames 1-18.
            </p>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>Special Plates:</span>
                <span className="text-fuchsia-400 font-bold">Lunar Gold, Halloween, Oni, etc.</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Vanity Sets:</span>
                <span className="text-fuchsia-400 font-bold">Avatars 1-18, Banners & Frames</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tires & Emojis:</span>
                <span className="text-fuchsia-400 font-bold">Sidewall 9 & StreetPass Emojis</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleInjectCustomVanity}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-fuchsia-500 hover:from-fuchsia-500 hover:to-pink-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(217,70,239,0.25)] hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] cursor-pointer"
            >
              {injectCustomPerk.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING VANITY...</span>
              ) : "🎖️ UNLOCK ALL 115+ VANITY ITEMS"}
            </button>
            {results.inject_custom_vanity && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_custom_vanity.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.inject_custom_vanity.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.inject_custom_vanity.msg}
              </div>
            )}
          </div>
        </div>
            {/* Custom Tuning Armory & Tires Section */}
        <div className="cyber-card cyber-card-glow-orange rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-orange-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-orange-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CUSTOM ARMORY (99x TIRES & PRO NODES)</h3>
                  <p className="text-[10px] font-chakra text-orange-300/80">99x Sets 1-4 Tires · 29+ T5 Engine/Trans/Suspension Parts</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold uppercase">
                PRO STOCK
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Refills your account inventory with 99x of each tire tier (Stock, Sets 1-4) plus 29+ top-tier engine blocks, gearboxes, ECUs, and aero parts.
            </p>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>Tire Sets:</span>
                <span className="text-orange-400 font-bold">99x Stock, Set 1, 2, 3, 4</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tuning Parts:</span>
                <span className="text-orange-400 font-bold">29 Pro Parts (ECU 6, Block 4, etc.)</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleInjectCustomArmory}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(249,115,22,0.25)] hover:shadow-[0_0_30px_rgba(249,115,22,0.4)] cursor-pointer"
            >
              {injectCustomPerk.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> STOCKING ARMORY...</span>
              ) : "🔧 STOCK 99x TIRES & 29+ PRO TUNING PARTS"}
            </button>
            {results.inject_custom_armory && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_custom_armory.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.inject_custom_armory.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.inject_custom_armory.msg}
              </div>
            )}
          </div>
        </div>
            {/* Custom Racing Clubs Syndicate Section */}
        <div className="cyber-card cyber-card-glow-teal rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-teal-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CUSTOM CLUBS SYNDICATE (20 CLUBS)</h3>
                  <p className="text-[10px] font-chakra text-teal-300/80">20 Racing Clubs · Elite Boss Defeats & Records</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold uppercase">
                20 CLUBS
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Unlocks complete membership and boss challenge progress for all 20 street clubs (Burnout Rangers, Spitfire, Emeralds, White Tigers, etc.).
            </p>

            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between text-zinc-400">
                <span>Tier 1-3 Clubs:</span>
                <span className="text-teal-400 font-bold">White Tigers, Pythons, Spitfire</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Tier 4-5 Clubs:</span>
                <span className="text-teal-400 font-bold">Burnout Rangers, Black Lotus, Emeralds</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={handleInjectCustomClubs}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] cursor-pointer"
            >
              {injectCustomPerk.isPending ? (
                <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING CLUBS...</span>
              ) : "🏆 UNLOCK ALL 20 RACING CLUBS"}
            </button>
            {results.inject_custom_clubs && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_custom_clubs.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.inject_custom_clubs.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.inject_custom_clubs.msg}
              </div>
            )}
          </div>
        </div>
          </div>
        </div>
      )}

      {/* ── EXTREME TIER SECTION ── */}
      {activeTier === "extreme" && (
        <div className="space-y-4">
          {/* Extreme Hero: Inject Add Everything */}
          <div className="cyber-card rounded-3xl p-6 border-2 border-rose-500/60 bg-gradient-to-br from-red-950/50 via-zinc-950 to-purple-950/50 shadow-[0_0_40px_rgba(244,63,94,0.3)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-xl animate-pulse">
                  🔥
                </div>
                <div>
                  <h3 className="text-sm font-gaming font-black text-white tracking-wider uppercase flex items-center gap-2">
                    <span>INJECT ADD EVERYTHING (EXTREME PRO TIER)</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase">
                      AUTHENTIC PRO PROFILE
                    </span>
                  </h3>
                  <p className="text-xs font-chakra text-rose-300/80">
                    117 Stage-5 Cars · All 6 World Maps · 90 Shop Packs · 128 Vanity · 99x Tires & Armory · 20 Clubs · Collectables · Safe Currency
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold uppercase shrink-0">
                🔥 Full Pro Sync · No StreetPass
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-300 leading-relaxed">
              Injects the full authentic Extreme build: all 117 vehicles with verified Stage-5 engine swaps and dyno tuning cells, 90 special shop-owned packs, 128 battle pass/vanity rewards, 5 sets of 99x tires, 29 tuning inventory collections, 20 clubs with boss records, Halloween 2026 & First Event collectables, quick emojis, and safe currency with exact 93,060 EXP.
            </p>

            <button
              onClick={() => handleInjectAddEverything("extreme")}
              disabled={anyPending}
              className="w-full py-4 rounded-2xl font-gaming font-black text-xs sm:text-sm tracking-widest uppercase bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white disabled:opacity-40 transition-all shadow-[0_0_30px_rgba(244,63,94,0.4)] hover:shadow-[0_0_50px_rgba(244,63,94,0.65)] cursor-pointer"
            >
              {injectAll.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> INJECTING EXTREME EVERYTHING...
                </span>
              ) : (
                "🔥 INJECT ADD EVERYTHING (EXTREME PRO TIER)"
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Extreme Vehicles Fleet Module */}
            <div className="cyber-card cyber-card-glow-red rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-rose-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                      <Flame className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">EXTREME FLEET DECK ({totalExtremeCars} CARS)</h3>
                      <p className="text-[10px] font-chakra text-rose-300/80">Stage-5 Pro Tunes · Engine Swaps</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setExtremeFleetModalOpen(true)}
                    className="text-[9px] font-chakra font-bold text-rose-400 hover:text-rose-200 underline cursor-pointer uppercase"
                  >
                    Inspect ({totalExtremeCars}) →
                  </button>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Injects the 117 pro-tuned vehicles from the extreme profile with complete tuning cell hierarchies, engine swaps, turbos, and custom liveries.
                </p>

                <div className="grid grid-cols-2 gap-1.5">
                  {EXTREME_FLEET_MODES.map(({ v, l, sub }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setExtremeFleetMode(v)}
                      className={`flex flex-col items-center py-2 px-1 rounded-xl text-center transition-all border cursor-pointer ${
                        extremeFleetMode === v
                          ? "bg-rose-600 border-rose-400 text-white font-bold shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                          : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                      }`}
                    >
                      <span className="text-xs font-chakra">{l}</span>
                      <span className={`text-[9px] font-mono mt-0.5 ${extremeFleetMode === v ? "text-rose-200" : "text-zinc-500"}`}>{sub}</span>
                    </button>
                  ))}
                </div>

                {extremeFleetMode === "custom" && (
                  <div className="pt-1">
                    <NumInput
                      label="Custom Car Count"
                      value={extremeFleetCarCount}
                      onChange={setExtremeFleetCarCount}
                      min={1}
                      max={totalExtremeCars}
                      placeholder="10"
                      icon="🏎️"
                      accent="text-rose-300"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeFleet}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-purple-600 hover:from-red-500 hover:to-purple-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(244,63,94,0.25)] hover:shadow-[0_0_30px_rgba(244,63,94,0.4)] cursor-pointer"
                >
                  {injectCustomCars.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING EXTREME FLEET...</span>
                  ) : extremeFleetMode === "mega216" ? "⚡ INJECT 216 MEGA FLEET TO GARAGE (117 EXTREME + 99 BASE)" : `🔥 INJECT ONLY EXTREME FLEET (${extremeFleetMode === "all" ? totalExtremeCars : (extremeFleetMode === "first50" ? 50 : (extremeFleetMode === "random10" ? 10 : extremeFleetCarCount))} CARS)`}
                </button>
                {results.customCars && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.customCars.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.customCars.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.customCars.msg}
                  </div>
                )}
              </div>
            </div>

                        {/* Maps & Real Estate Module */}
        <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Map className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">WORLD MAP & REAL ESTATE</h3>
                  <p className="text-[10px] font-chakra text-cyan-300/80">6 Zones · 52 Garages · 22 Clubs</p>
                </div>
              </div>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                1-Click Unlock
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Unlocks Mountain, Sunset, Port, Suburb & Midtown world map zones plus all 52 player houses and 22 clubs one-by-one under the hood without slot corruption.
            </p>

            <div className="grid grid-cols-2 gap-2 py-1">
              <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">World Maps</div>
                <div className="text-base font-black text-cyan-300 font-mono mt-0.5">
                  {profile ? `${profile.maps_count ?? 0} / 6 Active` : "6 Zones"}
                </div>
              </div>
              <div className="bg-black/60 border border-purple-500/30 rounded-xl p-3 text-center">
                <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">Garages & Clubs</div>
                <div className="text-base font-black text-purple-300 font-mono mt-0.5">
                  {profile ? `${profile.real_estates_count}H · ${profile.clubs_count}C` : "52H · 22C"}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              data-testid="button-unlock-maps-houses"
              onClick={() => unlockMapsHouses.mutate({
                data: {
                  token: session.token,
                  userId: session.carxId,
                  deviceId: session.deviceId,
                  uniqueId: session.uniqueId,
                  service_type: "unlock_maps_houses",
                  unlock_houses: true,
                  unlock_maps: true,
                  userToken
                }
              })}
              disabled={anyPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer"
            >
              {unlockMapsHouses.isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING MAPS & HOUSES...
                </span>
              ) : (
                "🗺️ UNLOCK ALL MAPS & HOUSES (1-CLICK)"
              )}
            </button>
            {results.mapsHouses && (
              <div className={`flex items-center gap-1.5 text-xs font-mono ${results.mapsHouses.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.mapsHouses.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {results.mapsHouses.msg}
              </div>
            )}
          </div>
        </div>

        {/* Extreme Shop Owned Packs */}
            <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">EXTREME SHOP PACKS (90 PACKS)</h3>
                      <p className="text-[10px] font-chakra text-amber-300/80">Special Shop Bundles · Store Unlocks</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase">
                    90 PACKS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks all 90 exclusive in-game store packs and special bundles directly into account ownership keys.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Special Bundles:</span>
                    <span className="text-amber-400 font-bold">special_1 to special_90</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Ownership Keys:</span>
                    <span className="text-emerald-400 font-bold">90 Packs Verified</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeShopPacks}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING PACKS...</span>
                  ) : "🛍️ UNLOCK ALL 90 SHOP OWNED PACKS"}
                </button>
                {results.inject_extreme_shop_packs && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_shop_packs.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_shop_packs.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_shop_packs.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Extreme Vanity Vault */}
            <div className="cyber-card cyber-card-glow-purple rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-fuchsia-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-fuchsia-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">EXTREME VANITY VAULT (128 ITEMS)</h3>
                      <p className="text-[10px] font-chakra text-fuchsia-300/80">Battle Pass Plates · Rare Avatars</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 font-bold uppercase">
                    128 KEYS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks all 128 Battle Pass season rewards, event vanity items, custom license plates, frames, and driver avatars from the extreme profile.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Reward Keys:</span>
                    <span className="text-fuchsia-400 font-bold">128 Total Unlocks</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Avatar / Banner:</span>
                    <span className="text-fuchsia-400 font-bold">Avatar 18 / Banner 18</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeVanity}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 via-pink-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(217,70,239,0.25)] hover:shadow-[0_0_30px_rgba(217,70,239,0.4)] cursor-pointer"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING VANITY...</span>
                  ) : "👑 UNLOCK 128 BATTLE PASS & VANITY REWARDS"}
                </button>
                {results.inject_extreme_vanity && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_vanity.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_vanity.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_vanity.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Extreme Armory & 99x Tires */}
            <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <Wrench className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">EXTREME ARMORY & 99x TIRES</h3>
                      <p className="text-[10px] font-chakra text-cyan-300/80">5x 99 Wheel Tires · 29 Parts Collections</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase">
                    MAX STOCK
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Stocks consumable wheel tires to 99 sets across all tire categories and synchronizes 29 tuning inventory collection parts.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Wheel Tire Sets:</span>
                    <span className="text-cyan-400 font-bold">5 Types x 99 Quantity</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Tuning Collections:</span>
                    <span className="text-cyan-400 font-bold">29 Parts Inventories</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeArmory}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-500 hover:from-cyan-500 hover:to-teal-500 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] cursor-pointer"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> STOCKING ARMORY...</span>
                  ) : "🛞 STOCK 99x TIRES & 29 TUNING COLLECTIONS"}
                </button>
                {results.inject_extreme_armory && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_armory.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_armory.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_armory.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Extreme Racing Clubs Syndicate */}
            <div className="cyber-card cyber-card-glow-emerald rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-teal-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                      <Users className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">EXTREME CLUBS (20 CLUBS & BOSSES)</h3>
                      <p className="text-[10px] font-chakra text-teal-300/80">20 Racing Clubs · Authentic Boss Records</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold uppercase">
                    20 CLUBS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks all 20 Racing Clubs with authentic leader progression, completed boss battles, trophies, and elite club triggers.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Clubs Total:</span>
                    <span className="text-teal-400 font-bold">20 Official Clubs</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Boss Victories:</span>
                    <span className="text-teal-400 font-bold">100% Completed</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeClubs}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(20,184,166,0.25)] hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] cursor-pointer"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING CLUBS...</span>
                  ) : "🏆 UNLOCK 20 CLUBS & BOSS RECORDS"}
                </button>
                {results.inject_extreme_clubs && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_clubs.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_clubs.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_clubs.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Extreme Event Collectables & Emojis */}
            <div className="cyber-card cyber-card-glow-purple rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-purple-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">EVENT COLLECTABLES & EMOJIS</h3>
                      <p className="text-[10px] font-chakra text-purple-300/80">Halloween 2026 · First Event · Emojis</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase">
                    EVENTS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Injects exclusive event collectables records including Halloween 2026, First Event items, and equipped in-game quick emojis.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Events:</span>
                    <span className="text-purple-400 font-bold">halloween_2026, first_event</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Equipped Emojis:</span>
                    <span className="text-purple-400 font-bold">emoji_1, 2, 3, 4</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeCollectables}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] cursor-pointer"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING EVENTS...</span>
                  ) : "🎃 UNLOCK COLLECTABLES & EMOJIS"}
                </button>
                {results.inject_extreme_collectables && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_collectables.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_collectables.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_collectables.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Extreme Treasury */}
            <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">EXTREME SAFE TREASURY</h3>
                      <p className="text-[10px] font-chakra text-amber-300/80">Safe Cash · Safe Gold · Level 50 (93,060 EXP)</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                    ANTI-BAN SAFE
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Safely adds +50,000 Soft Cash, +5,000 Gold, and synchronizes driver experience exactly to 93,060 (Level 50 max cap).
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Soft Cash:</span>
                    <span className="text-emerald-400 font-bold">+50,000</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Gold Coins:</span>
                    <span className="text-amber-400 font-bold">+5,000</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Driver EXP:</span>
                    <span className="text-purple-400 font-bold">93,060 (Lv. 50 Cap)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeTreasury}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(245,158,11,0.25)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-pointer"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING SAFE TREASURY...</span>
                  ) : "💰 INJECT +50K CASH, +5K GOLD & LV. 50 (93,060 EXP)"}
                </button>
                {results.inject_extreme_treasury && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_treasury.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_treasury.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_treasury.msg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ELITE PACK TIER SECTION ── */}
      {activeTier === "elite" && (
        <div className="space-y-4">
          {/* Elite Pack Hero: Inject Complete Elite Pack */}
          <div className="cyber-card rounded-3xl p-6 border-2 border-cyan-500/60 bg-gradient-to-br from-cyan-950/40 via-teal-950/20 to-zinc-900/90 shadow-[0_0_35px_rgba(6,182,212,0.2)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-cyan-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-lg shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  👑
                </div>
                <div>
                  <h3 className="text-sm font-gaming font-black text-white tracking-wider uppercase flex items-center gap-2">
                    <span>INJECT COMPLETE ELITE PACK (ALL-IN-ONE)</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                      MASTER ELITE UNLOCK
                    </span>
                  </h3>
                  <p className="text-xs font-chakra text-cyan-300/80">
                    Static RGB Neons & Drift Smoke On All Cars · 90 Shop Packs · 128 Vanity & 67 License Plates · 99x Tires & Armory · 20 Clubs & Boss Records · 3-Star Freeride
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold uppercase tracking-wider">
                ⚡ 100% Full Unlocks
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-300 leading-relaxed py-2">
              Injects the absolute complete Elite Pack extracted from the master profile: unlocks and equips static RGB underglow neons and drift smoke on every garage car, unlocks all 90 in-game shop packs, all 67 exclusive license plates, full Battle Pass vanity, 99x tire armory, all 20 clubs, and 3-star stunts.
            </p>

            <button
              onClick={handleInjectElitePack}
              disabled={anyPending}
              className="w-full py-4 rounded-2xl font-gaming font-black text-xs sm:text-sm tracking-widest uppercase transition-all bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] cursor-pointer disabled:opacity-40"
            >
              {injectCustomPerk.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> INJECTING COMPLETE ELITE PACK...
                </span>
              ) : (
                "👑 INJECT COMPLETE ELITE PACK (ALL UNLOCKS + NEONS + PLATES + PACKS)"
              )}
            </button>
            {results.inject_elite_pack && (
              <div className={`mt-2 flex items-center gap-1.5 text-xs font-mono ${results.inject_elite_pack.ok ? "text-emerald-400" : "text-red-400"}`}>
                {results.inject_elite_pack.ok ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {results.inject_elite_pack.msg}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: Ultimate Neons, Liveries & Pro Styling */}
            <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-sm">
                      🌈
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">ULTIMATE NEONS, LIVERIES & STYLING</h3>
                      <p className="text-[10px] font-chakra text-cyan-300/80">3-Way RGB Neons · 16,000+ Vinyl Liveries · Drift Smoke & Flames</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                    12 RGB THEMES
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Equips 3-way static underglow neons (front, sides, rear in 12 rotating RGB themes), transfers 16,000+ multi-layer vinyl liveries & unlocks 8 vinyl packs, custom burnout drift smoke, headlight glass dyes, limo blackout tint, and spitting backfire/nitro flames on all garage cars.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>3-Way Static Neons:</span>
                    <span className="text-cyan-400 font-bold">Front / Sides / Rear (12 Themes)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Livery & Vinyl Vault:</span>
                    <span className="text-cyan-400 font-bold">16,000+ Layers & 8 Packs Unlocked</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Drift Smoke & Optics:</span>
                    <span className="text-cyan-400 font-bold">Custom Smoke, Headlights & Limo Tint</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Exhaust Flames:</span>
                    <span className="text-cyan-400 font-bold">Nitro & Backfire Active</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectEliteNeon}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-500 hover:from-cyan-500 hover:to-teal-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> EQUIPPING NEONS, LIVERIES & FLAMES...</span>
                  ) : "⚡ EQUIP MASTER NEONS, LIVERIES & FLAMES ON ALL CARS"}
                </button>
                {results.inject_elite_neon && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_elite_neon.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_elite_neon.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_elite_neon.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Elite License Plates & Vanity */}
            <div className="cyber-card cyber-card-glow-purple rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-purple-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-sm">
                      🏆
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">LICENSE PLATES & VANITY</h3>
                      <p className="text-[10px] font-chakra text-purple-300/80">67 Plates · 18 Avatars · 18 Frames · 18 Banners</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                    128 ITEMS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks all 67 exclusive license plates (Lunar Carnival, Sunset City, Akuma Gold, etc.), plus all 18 Avatars, 18 Frames, 18 Banners, and Champion liveries.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Number Plates:</span>
                    <span className="text-purple-400 font-bold">67 Rare & Event Plates</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Driver Style:</span>
                    <span className="text-purple-400 font-bold">18 Avatars · Frames · Banners</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Event Liveries:</span>
                    <span className="text-purple-400 font-bold">Lunar Carnival & Champion</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeVanity}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-500 hover:from-purple-500 hover:to-fuchsia-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING PLATES & VANITY...</span>
                  ) : "🎖️ UNLOCK ALL 67 LICENSE PLATES & 128 VANITY ITEMS"}
                </button>
                {results.inject_extreme_vanity && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_vanity.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_vanity.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_vanity.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Elite Shop Packs */}
            <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-sm">
                      🛍️
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">ELITE SHOP PACKS (90 PACKS)</h3>
                      <p className="text-[10px] font-chakra text-amber-300/80">90 Special Shop DLCs · Mountain & Sunset Expansions</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    90 PACKS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks all 90 official in-game store special packs (special_1 to special_90) plus the full Mountain and Sunset IAP map expansion packs.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Store Packs:</span>
                    <span className="text-amber-400 font-bold">special_1 ... special_90 (All 90)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>DLC Map Expansions:</span>
                    <span className="text-amber-400 font-bold">Mountain & Sunset IAP Full</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeShopPacks}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING SHOP PACKS...</span>
                  ) : "🛍️ UNLOCK ALL 90 SPECIAL SHOP PACKS"}
                </button>
                {results.inject_extreme_shop_packs && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_shop_packs.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_shop_packs.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_shop_packs.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Elite Armory & 99x Tires */}
            <div className="cyber-card cyber-card-glow-rose rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-rose-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-sm">
                      🏎️
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">ELITE ARMORY & 99x TIRES</h3>
                      <p className="text-[10px] font-chakra text-rose-300/80">99x Wheel Tires · 29 Legendary Tuning Parts</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase">
                    MAX ARMORED
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Stocks your consumables inventory with 99x of every tire set compound plus 29 high-performance tuning parts in your player collection.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Consumable Tires:</span>
                    <span className="text-rose-400 font-bold">99x Stock, Sets 1, 2, 3, 4</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Tuning Inventory:</span>
                    <span className="text-rose-400 font-bold">29 Parts (ECU, Gearbox, Exhaust)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeArmory}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> STOCKING ARMORY...</span>
                  ) : "🔧 UNLOCK 99x TIRES & 29 TUNING PARTS"}
                </button>
                {results.inject_extreme_armory && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_armory.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_armory.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_armory.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 5: Elite Freeride Stunts & Collectables */}
            <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-sm">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">FREERIDE STUNTS & COLLECTABLES</h3>
                      <p className="text-[10px] font-chakra text-cyan-300/80">3-Star Radars · Drift Zones · Donuts · Gift Boxes</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                    3-STAR ELITE
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Injects instant 3-star records across all open-world speed radars, average speed cameras, drift zones, donut pads, plus event gift boxes and emojis.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Speed Radars:</span>
                    <span className="text-cyan-400 font-bold">12 Radars (165-230 km/h)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Drift & Donuts:</span>
                    <span className="text-cyan-400 font-bold">30,000 Pts / 8,000 Pts</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectFreerideStunts}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-cyan-500 hover:from-cyan-500 hover:to-teal-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING STUNTS...</span>
                  ) : "⭐ INJECT 3-STAR OPEN WORLD STUNTS & GIFTS"}
                </button>
                {results.inject_freeride_stunts && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_freeride_stunts.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_freeride_stunts.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_freeride_stunts.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 6: Elite Racing Clubs & Boss Defeats */}
            <div className="cyber-card cyber-card-glow-teal rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-teal-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-sm">
                      🏁
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">ELITE RACING CLUBS & BOSSES</h3>
                      <p className="text-[10px] font-chakra text-teal-300/80">20 Racing Clubs · Elite Boss Challenge Records</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase">
                    20 CLUBS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks complete membership, rewards, and elite boss challenge progress across all 20 street clubs (Burnout Rangers, Speedstar, Drift United, White Tigers, etc.).
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Street Clubs:</span>
                    <span className="text-teal-400 font-bold">20/20 Fully Completed</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Elite Boss Records:</span>
                    <span className="text-teal-400 font-bold">Defeated & Unlocked</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectExtremeClubs}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING CLUBS...</span>
                  ) : "🏆 UNLOCK 20 RACING CLUBS & ELITE BOSS RECORDS"}
                </button>
                {results.inject_extreme_clubs && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_extreme_clubs.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_extreme_clubs.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_extreme_clubs.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 7: World Map & Real Estate */}
            <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <Map className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">WORLD MAP & REAL ESTATE</h3>
                      <p className="text-[10px] font-chakra text-cyan-300/80">6 Zones · 52 Garages · 22 Clubs</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                    1-Click Unlock
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks Mountain, Sunset, Port, Suburb & Midtown world map zones plus all 52 player houses and 22 club garage locations.
                </p>

                <div className="grid grid-cols-2 gap-2 py-1">
                  <div className="bg-black/60 border border-cyan-500/30 rounded-xl p-3 text-center">
                    <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">World Maps</div>
                    <div className="text-base font-black text-cyan-300 font-mono mt-0.5">
                      {profile ? `${profile.maps_count ?? 0} / 6 Active` : "6 Zones"}
                    </div>
                  </div>
                  <div className="bg-black/60 border border-purple-500/30 rounded-xl p-3 text-center">
                    <div className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">Garages & Clubs</div>
                    <div className="text-base font-black text-purple-300 font-mono mt-0.5">
                      {profile ? `${profile.real_estates_count}H · ${profile.clubs_count}C` : "52H · 22C"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  data-testid="button-unlock-maps-houses"
                  onClick={() => unlockMapsHouses.mutate({
                    data: {
                      token: session.token,
                      userId: session.carxId,
                      deviceId: session.deviceId,
                      uniqueId: session.uniqueId,
                      service_type: "unlock_maps_houses",
                      unlock_houses: true,
                      unlock_maps: true,
                      userToken
                    }
                  })}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-400 hover:from-cyan-400 hover:to-teal-300 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                >
                  {unlockMapsHouses.isPending ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING MAPS & HOUSES...
                    </span>
                  ) : (
                    "🗺️ UNLOCK ALL MAPS & HOUSES (1-CLICK)"
                  )}
                </button>
                {results.mapsHouses && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.mapsHouses.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.mapsHouses.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.mapsHouses.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 8: Business Delivery Reset */}
            <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">BUSINESS DELIVERY RESET</h3>
                      <p className="text-[10px] font-chakra text-amber-300/80">Car & Parts Deliveries · Zero Cooldown</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    INSTANT PAYOUTS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Clears the wait timers for Low, Mid, and High-tier Car & Parts delivery business activities so you can instantly collect payouts without cooldowns.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Car Deliveries:</span>
                    <span className="text-amber-400 font-bold">Low / Mid / High (Ready)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Part Deliveries:</span>
                    <span className="text-amber-400 font-bold">Low / Mid / High (Ready)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectBusinessDeliveries}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> RESETTING TIMERS...</span>
                  ) : "📦 ZERO COOLDOWN CAR & PARTS DELIVERIES"}
                </button>
                {results.inject_business_deliveries && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_business_deliveries.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_business_deliveries.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_business_deliveries.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 9: Fleet Overclock */}
            <div className="cyber-card cyber-card-glow-purple rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-purple-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                      <Fuel className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">FLEET FUEL & NITRO OVERCLOCK</h3>
                      <p className="text-[10px] font-chakra text-purple-300/80">100L Max Tanks · Zero Engine Damage</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                    100L TANKS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Overclocks every vehicle in your inventory to 100L Fuel, 100L Nitro, clears all wear-and-tear engine damage, and optimizes fuel consumption.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Gasoline Tank:</span>
                    <span className="text-purple-400 font-bold">100 / 100 Liters (Full)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Nitro Booster:</span>
                    <span className="text-purple-400 font-bold">100 / 100 Liters (Max)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Engine Damage:</span>
                    <span className="text-emerald-400 font-bold">0% (Flawless Mint)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectFleetOverclock}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> OVERCLOCKING FLEET...</span>
                  ) : "⛽ 100L FUEL & NITRO OVERCLOCK ALL CARS"}
                </button>
                {results.inject_fleet_overclock && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_fleet_overclock.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_fleet_overclock.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_fleet_overclock.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 10: Elite Top-10 Leaderboards & Stunts */}
            <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">LEADERBOARD BADGES & STUNTS</h3>
                      <p className="text-[10px] font-chakra text-amber-300/80">Top 10 Global Records · Stunt Trophies</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    RANK #1
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Injects top-10 leaderboard drift records, maximum stunt scores across all city courses, and unlocks high-tier driver achievement trophies.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Global Drift Leaderboard:</span>
                    <span className="text-amber-400 font-bold">Top 10 Master Drift</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Stunt Trophies:</span>
                    <span className="text-amber-400 font-bold">Gold Cups Unlocked</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectLeaderboardAchievements}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING LEADERBOARDS...</span>
                  ) : "🏆 UNLOCK TOP 10 LEADERBOARDS & STUNTS"}
                </button>
                {results.inject_leaderboard_achievements && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_leaderboard_achievements.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_leaderboard_achievements.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_leaderboard_achievements.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 11: Story & Career Quests Auto-Complete */}
            <div className="cyber-card cyber-card-glow-teal rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-teal-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-teal-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">STORY & CAREER QUESTS</h3>
                      <p className="text-[10px] font-chakra text-teal-300/80">Intro Quests · Chapter Milestones · All Rewards</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold uppercase">
                    100% DONE
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Automatically flags all story intro quests, tuning tutorials, apartment unlocks, and chapter progression milestones as 100% finished with all rewards claimed.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Tutorial & Intro:</span>
                    <span className="text-teal-400 font-bold">Fully Completed</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Quest Rewards:</span>
                    <span className="text-teal-400 font-bold">Collected & Deposited</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectQuestsComplete}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(20,184,166,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> COMPLETING QUESTS...</span>
                  ) : "📜 AUTO-COMPLETE ALL CAREER & STORY QUESTS"}
                </button>
                {results.inject_quests_complete && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_quests_complete.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_quests_complete.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_quests_complete.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 8: Syndicate Vault, Paints & Rental Slots */}
            <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-sm">
                      👑
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">SYNDICATE VAULT & PAINTS</h3>
                      <p className="text-[10px] font-chakra text-amber-300/80">10x Paint Presets · Driver Suits · 8x Rental Slots</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    SYNDICATE BOSS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks 10 custom candy & chrome paint recipes in your paint booth, unlocks pro carbon helmets and racing suits, conquers all 20 club bosses with 50K rep, and activates 8 car rental slots for passive income.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Custom Paint Presets:</span>
                    <span className="text-amber-400 font-bold">10 Saved Palettes (Candy/Chrome)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Driver Suits & Helmets:</span>
                    <span className="text-amber-400 font-bold">Carbon Helmets & Pro Suits</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Club Boss Dominance:</span>
                    <span className="text-amber-400 font-bold">All 20 Clubs 100% Conquered</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Car Rental Slots:</span>
                    <span className="text-amber-400 font-bold">8 Slots Active (Passive Cash)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectSyndicateVault}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING SYNDICATE VAULT...</span>
                  ) : "👑 UNLOCK SYNDICATE VAULT, PAINTS & RENTALS"}
                </button>
                {results.inject_syndicate_vault && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_syndicate_vault.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_syndicate_vault.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_syndicate_vault.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 12: 216 Mega Fleet Master Pack */}
            <div className="cyber-card cyber-card-glow-rose rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-rose-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                      <Car className="w-4 h-4 text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">216 MEGA FLEET MASTER</h3>
                      <p className="text-[10px] font-chakra text-rose-300/80">99 Base + 117 Custom Cars · All Garage Slots</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase">
                    216 CARS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Injects the entire 216-car master fleet in one click: all 99 original base game cars plus all 117 custom-tuned fleet vehicles pre-loaded with custom liveries, 3-way RGB neons, and pro tuning directly into your garage.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Base Authentic Cars:</span>
                    <span className="text-rose-400 font-bold">99 Base Models</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Custom Fleet Builds:</span>
                    <span className="text-rose-400 font-bold">117 Custom Cars</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectMegaFleet216}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 hover:from-rose-500 hover:to-pink-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.25)]"
                >
                  {injectCars.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING 216 CARS...</span>
                  ) : "⚡ INJECT 216 MEGA FLEET (99 BASE + 117 CUSTOM)"}
                </button>
                {results.cars && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.cars.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.cars.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.cars.msg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── OVERDRIVE EXPERIMENTAL TIER SECTION (WARNING: HAS FLAWS) ── */}
      {activeTier === "overdrive" && (
        <div className="space-y-4">
          {/* Overdrive Warning Hero & Master Button */}
          <div className="cyber-card rounded-3xl p-6 border-2 border-amber-500/60 bg-gradient-to-br from-amber-950/40 via-zinc-950 to-orange-950/40 shadow-[0_0_35px_rgba(245,158,11,0.3)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xl">
                  ☣️
                </div>
                <div>
                  <h3 className="text-sm font-gaming font-black text-white tracking-wider uppercase flex items-center gap-2">
                    <span>OVERDRIVE EXPERIMENTAL TIER</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/50 font-bold uppercase">
                      ⚠️ UNSTABLE · HAS FLAWS
                    </span>
                  </h3>
                  <p className="text-xs font-chakra text-amber-300/80">
                    Freeride Stunts · Tuning Warehouse & Swaps · Event Collectables · Top-10 Leaderboard · Instant Deliveries · 100L Fleet Overclock
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold uppercase shrink-0 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> READ WARNINGS BEFORE INJECTING
              </span>
            </div>

            {/* Prominent Warnings & Known Flaws */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-gaming text-xs font-bold uppercase">
                  <AlertCircle className="w-4 h-4 shrink-0" /> 1. Permanent Stunt Records
                </div>
                <p className="text-[11px] font-chakra text-zinc-400 leading-relaxed">
                  Injects 3-Star high-speed records on all 20+ Radars, Speed Cameras, and Donut Zones on your account. These records write permanently to your save and cannot be cleared or reset back to zero.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-gaming text-xs font-bold uppercase">
                  <AlertCircle className="w-4 h-4 shrink-0" /> 2. Public Leaderboard Visibility
                </div>
                <p className="text-[11px] font-chakra text-zinc-400 leading-relaxed">
                  Unlocks the Top-10 in the World global rank badge (Rang 10) and 999+ duel wins. Other players and club leaders will see this prestigious badge on your public player card in multiplayer rooms.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-gaming text-xs font-bold uppercase">
                  <AlertCircle className="w-4 h-4 shrink-0" /> 3. Ghost Seasonal Event Collectables
                </div>
                <p className="text-[11px] font-chakra text-zinc-400 leading-relaxed">
                  Forces Halloween 2026 and First Event secret trophies into your inventory. Because these events are seasonal, map markers may remain dormant until the official event calendars activate in-game.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-amber-500/30 space-y-1">
                <div className="flex items-center gap-2 text-amber-400 font-gaming text-xs font-bold uppercase">
                  <AlertCircle className="w-4 h-4 shrink-0" /> 4. App Force-Restart Required
                </div>
                <p className="text-[11px] font-chakra text-zinc-400 leading-relaxed">
                  Tuning warehouse parts and engine swap crates require a complete force-quit and restart of the CarX Drift Racing 2 game client for the dyno workshop to detect and populate the newly injected crates.
                </p>
              </div>
            </div>

            {/* Master Overdrive Button */}
            <button
              onClick={() => handleInjectAddEverything("overdrive")}
              disabled={anyPending}
              className="w-full py-4 rounded-2xl font-gaming font-black text-xs sm:text-sm tracking-widest uppercase bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:to-red-500 text-white disabled:opacity-40 transition-all shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:shadow-[0_0_40px_rgba(245,158,11,0.6)] cursor-pointer"
            >
              {injectAll.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> INJECTING OVERDRIVE EXPERIMENTAL...
                </span>
              ) : (
                "☣️ INJECT ALL OVERDRIVE EXPERIMENTAL FEATURES (1-CLICK MASTER)"
              )}
            </button>
          </div>

          {/* Modular Grid of Overdrive Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Card 1: 3-Star Freeride Stunts & World Records */}
            <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-sm">
                      ⚡
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">3-STAR FREERIDE STUNTS</h3>
                      <p className="text-[10px] font-chakra text-amber-300/80">Radars · Speed Traps · Donut Zones · Drift Sectors</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    3-STAR RECORDS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Injects 3-star high-speed records on all speed cameras and radars across Sunset City and Mountain, plus all donut stunt pads and street drift zones.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Speed Radars:</span>
                    <span className="text-amber-400 font-bold">All 12+ Radars 3-Star High Speed</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Donut & Drift Zones:</span>
                    <span className="text-amber-400 font-bold">Max Points Recorded</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectFreerideStunts}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING 3-STAR STUNTS...</span>
                  ) : "⚡ INJECT 3-STAR FREERIDE STUNTS"}
                </button>
                {results.inject_freeride_stunts && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_freeride_stunts.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_freeride_stunts.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_freeride_stunts.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Top-10 Global Leaderboard Badges */}
            <div className="cyber-card cyber-card-glow-red rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-red-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-sm">
                      🥇
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">TOP-10 GLOBAL LEADERBOARD</h3>
                      <p className="text-[10px] font-chakra text-red-300/80">Rang 10 World Honors · 999+ Duels Won</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 font-bold uppercase">
                    RANG 10
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks Top-10 in the World global rank badge (Rang 10), Top 50, Top 100 badges, 9,999,999 drift score honor, and 999+ multiplayer duel victories on your profile card.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>World Rank Badge:</span>
                    <span className="text-red-400 font-bold">Top-10 in the World (Rang 10)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Duels & Stunts:</span>
                    <span className="text-red-400 font-bold">999+ Wins · 150+ Activities</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectLeaderboardAchievements}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> INJECTING TOP-10 BADGES...</span>
                  ) : "🥇 UNLOCK TOP-10 LEADERBOARD BADGES"}
                </button>
                {results.inject_leaderboard_achievements && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_leaderboard_achievements.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_leaderboard_achievements.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_leaderboard_achievements.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 3: Player Armory & Crate Engine Swaps */}
            <div className="cyber-card cyber-card-glow-cyan rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-cyan-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-sm">
                      🧰
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">TUNING ARMORY & ENGINE SWAPS</h3>
                      <p className="text-[10px] font-chakra text-cyan-300/80">Spare Stage-5 Parts · 5x Crate Engine Swaps</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase">
                    SWAP CRATES
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Stocks your player inventory with Stage-5 racing engine blocks, twin-turbos, racing camshafts, and sports coilover suspensions, plus 5x ready-to-drop crate engines and transmissions.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Stage-5 Parts:</span>
                    <span className="text-cyan-400 font-bold">10x Each Component Stocked</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Swap Crates:</span>
                    <span className="text-cyan-400 font-bold">5x Engines · 5x Transmissions</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectTuningWarehouse}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> STOCKING ARMORY...</span>
                  ) : "🧰 STOCK TUNING ARMORY & CRATE SWAPS"}
                </button>
                {results.inject_tuning_warehouse && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_tuning_warehouse.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_tuning_warehouse.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_tuning_warehouse.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Secret Event Collectables & Map Trophies */}
            <div className="cyber-card cyber-card-glow-orange rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-orange-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-sm">
                      🎃
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">SECRET EVENT COLLECTABLES</h3>
                      <p className="text-[10px] font-chakra text-orange-300/80">Halloween 2026 · First Event Secret Trophies</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-bold uppercase">
                    ALL TROPHIES
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Automatically finds and marks all hidden holiday pumpkins, secret tokens, and map trophies across Sunset City, Industrial, and Mountain as collected.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Halloween 2026:</span>
                    <span className="text-orange-400 font-bold">All 10 Pumpkins Collected</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>First Event:</span>
                    <span className="text-orange-400 font-bold">All 10 Secret Trophies Claimed</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectEventCollectables}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> CLAIMING EVENT TROPHIES...</span>
                  ) : "🎃 UNLOCK ALL SECRET MAP TROPHIES"}
                </button>
                {results.inject_event_collectables && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_event_collectables.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_event_collectables.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_event_collectables.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 5: Instant Business Delivery Timers */}
            <div className="cyber-card cyber-card-glow-purple rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-purple-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-sm">
                      ⏱️
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">INSTANT BUSINESS DELIVERIES</h3>
                      <p className="text-[10px] font-chakra text-purple-300/80">Zero Cooldown Timers · Car & Part Deliveries</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold uppercase">
                    0 COOLDOWN
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Bypasses the 12–24 hour waiting periods on low, middle, and high car and part delivery contracts, letting you collect instant cash and gold business payouts.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Car Deliveries:</span>
                    <span className="text-purple-400 font-bold">Low / Mid / High Timer Reset</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Part Deliveries:</span>
                    <span className="text-purple-400 font-bold">Instant Payout Available</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectBusinessDeliveries}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> RESETTING DELIVERY TIMERS...</span>
                  ) : "⏱️ RESET BUSINESS DELIVERY TIMERS"}
                </button>
                {results.inject_business_deliveries && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_business_deliveries.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_business_deliveries.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_business_deliveries.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 6: 100L Fuel & Nitro Fleet Overclock */}
            <div className="cyber-card cyber-card-glow-rose rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-rose-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-sm">
                      ⛽
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">FLEET TANK OVERCLOCK</h3>
                      <p className="text-[10px] font-chakra text-rose-300/80">100L Fuel · 100L Nitro · 0 Engine Wear</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold uppercase">
                    100L OVERCLOCK
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Overclocks every single car in your account garage with 100L maximum fuel tanks, 100L super nitro bottles, and eliminates engine wear and repair limits.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Fuel & Nitro Tanks:</span>
                    <span className="text-rose-400 font-bold">100L Max Capacity (All Cars)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Engine Durability:</span>
                    <span className="text-rose-400 font-bold">100% Mint · 0% Wear</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectFleetOverclock}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(244,63,94,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> OVERCLOCKING FLEET...</span>
                  ) : "⛽ OVERCLOCK ALL CARS WITH 100L FUEL & NITRO"}
                </button>
                {results.inject_fleet_overclock && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_fleet_overclock.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_fleet_overclock.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_fleet_overclock.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 7: Story & Career Quests Auto-Complete */}
            <div className="cyber-card cyber-card-glow-emerald rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-emerald-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-sm">
                      📜
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">CAREER & STORY QUESTS</h3>
                      <p className="text-[10px] font-chakra text-emerald-300/80">All Story Progression Quests Completed</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold uppercase">
                    ALL QUESTS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Marks all intro, prologue, and story career quests as completed with rewards collected, eliminating tutorial popups and unlocking career gates.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Story Quests:</span>
                    <span className="text-emerald-400 font-bold">Intro & Career 100% Completed</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Quest Rewards:</span>
                    <span className="text-emerald-400 font-bold">All XP & Bonuses Collected</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectQuestsComplete}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> COMPLETING QUESTS...</span>
                  ) : "📜 AUTO-COMPLETE ALL CAREER & STORY QUESTS"}
                </button>
                {results.inject_quests_complete && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_quests_complete.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_quests_complete.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_quests_complete.msg}
                  </div>
                )}
              </div>
            </div>

            {/* Card 8: Syndicate Vault, Paints & Rental Slots */}
            <div className="cyber-card cyber-card-glow-amber rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-amber-500/30">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-sm">
                      👑
                    </div>
                    <div>
                      <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">SYNDICATE VAULT & PAINTS</h3>
                      <p className="text-[10px] font-chakra text-amber-300/80">10x Paint Presets · Driver Suits · 8x Rental Slots</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                    SYNDICATE BOSS
                  </span>
                </div>

                <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
                  Unlocks 10 custom candy & chrome paint recipes in your paint booth, unlocks pro carbon helmets and racing suits, conquers all 20 club bosses with 50K rep, and activates 8 car rental slots for passive income.
                </p>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between text-zinc-400">
                    <span>Custom Paint Presets:</span>
                    <span className="text-amber-400 font-bold">10 Saved Palettes (Candy/Chrome)</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Driver Suits & Helmets:</span>
                    <span className="text-amber-400 font-bold">Carbon Helmets & Pro Suits</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Club Boss Dominance:</span>
                    <span className="text-amber-400 font-bold">All 20 Clubs 100% Conquered</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Car Rental Slots:</span>
                    <span className="text-amber-400 font-bold">8 Slots Active (Passive Cash)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                <button
                  onClick={handleInjectSyndicateVault}
                  disabled={anyPending}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-black font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                >
                  {injectCustomPerk.isPending ? (
                    <span className="flex items-center justify-center gap-1.5"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> UNLOCKING SYNDICATE VAULT...</span>
                  ) : "👑 UNLOCK SYNDICATE VAULT, PAINTS & RENTALS"}
                </button>
                {results.inject_syndicate_vault && (
                  <div className={`flex items-center gap-1.5 text-xs font-mono ${results.inject_syndicate_vault.ok ? "text-emerald-400" : "text-red-400"}`}>
                    {results.inject_syndicate_vault.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {results.inject_syndicate_vault.msg}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GLOBAL ACTIVE BAN DETECTOR ── */}
      <div className="pt-2">
        {/* Anti-Cheat & Active Token Ban Detector */}
        <div className="cyber-card cyber-card-glow-red rounded-3xl p-5 space-y-4 flex flex-col justify-between border border-red-500/30">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h3 className="text-xs font-gaming font-bold text-white tracking-wider uppercase">ANTI-CHEAT BAN DETECTOR</h3>
                  <p className="text-[10px] font-chakra text-red-300/80">Active Token Probe · Restriction Test</p>
                </div>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border font-bold uppercase ${
                profile?.isBanned || banCheckResult?.isBanned
                  ? "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
              }`}>
                {profile?.isBanned || banCheckResult?.isBanned ? "🚨 BANNED" : "🛡️ ACTIVE / CLEAN"}
              </span>
            </div>

            <p className="text-xs font-chakra text-zinc-400 leading-relaxed">
              Test active CarX session token against anti-cheat servers to verify suspension flags, restriction status, and multiplayer matchmaking standing.
            </p>

            <div className="space-y-2">
              <label className="text-[11px] font-chakra font-bold text-zinc-400 flex items-center justify-between uppercase tracking-wider">
                <span>Active Token to Test</span>
                {session.token && (
                  <button
                    type="button"
                    onClick={() => setTokenToProbe(session.token)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold cursor-pointer"
                  >
                    Use Current Session
                  </button>
                )}
              </label>
              <input
                type="text"
                value={tokenToProbe}
                onChange={(e) => setTokenToProbe(e.target.value)}
                placeholder="Paste active CarX session token..."
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-400 font-mono"
              />
            </div>

            {banCheckResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-2xl border-2 text-xs font-chakra space-y-2.5 shadow-2xl ${
                  banCheckResult.isBanned
                    ? "bg-zinc-950 border-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.45)] ring-1 ring-red-500/50"
                    : "bg-zinc-950 border-emerald-400 text-white shadow-[0_0_30px_rgba(52,211,153,0.35)] ring-1 ring-emerald-500/50"
                }`}
              >
                <div className="flex items-center justify-between font-bold pb-2 border-b border-zinc-800">
                  <span className="flex items-center gap-2 text-sm uppercase font-gaming tracking-wide">
                    {banCheckResult.isBanned ? (
                      <span className="text-red-400 flex items-center gap-1.5 font-black">
                        🚨 BANNED / RESTRICTED
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5 font-black">
                        🛡️ ACTIVE & CLEAN (SAFE)
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-md border border-zinc-800">
                    {banCheckResult.timestamp}
                  </span>
                </div>

                {/* Copyable Gmail in Result Box */}
                {session.email && (
                  <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-900/90 border border-zinc-700/80">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs">📧</span>
                      <span className="font-mono text-xs font-bold text-amber-300 truncate select-all">
                        {session.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(session.email);
                        setCopiedBanEmail(true);
                        setTimeout(() => setCopiedBanEmail(false), 2000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                    >
                      {copiedBanEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedBanEmail ? "Copied!" : "Copy Gmail"}
                    </button>
                  </div>
                )}

                <div className="text-xs font-mono text-zinc-100 bg-black/60 p-2.5 rounded-xl border border-zinc-800/80 leading-relaxed break-words">
                  <span className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-widest block mb-1">
                    DIAGNOSTIC REPORT:
                  </span>
                  {banCheckResult.banReason || (banCheckResult.isBanned ? "Account flagged by CarX anti-cheat security filters." : "No ban flags detected. Account active on game servers.")}
                </div>
              </motion.div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
            <button
              onClick={() => handleRunBanCheck()}
              disabled={checkBan.isPending || !tokenToProbe.trim()}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] cursor-pointer"
            >
              {checkBan.isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> PROBING ANTI-CHEAT STATUS...
                </span>
              ) : (
                "🛡️ TEST ACTIVE TOKEN BAN STATUS"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* High-Visibility Ban Check Popup Modal */}
      {banModalOpen && banCheckResult && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className={`cyber-card rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_0_60px_rgba(0,0,0,0.95)] border-2 space-y-5 ${
            banCheckResult.isBanned
              ? "border-red-500 shadow-[0_0_45px_rgba(239,68,68,0.5)] bg-zinc-950"
              : "border-emerald-400 shadow-[0_0_45px_rgba(52,211,153,0.45)] bg-zinc-950"
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
                  banCheckResult.isBanned ? "bg-red-500/20 border-red-500/50 text-red-400" : "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                }`}>
                  {banCheckResult.isBanned ? <ShieldAlert className="w-6 h-6 animate-pulse" /> : <ShieldCheck className="w-6 h-6 text-emerald-400" />}
                </div>
                <div>
                  <h3 className="text-sm font-gaming font-bold text-white tracking-wider uppercase">
                    ANTI-CHEAT DIAGNOSTIC
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-400">{banCheckResult.timestamp}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBanModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Status Banner */}
            <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 ${
              banCheckResult.isBanned
                ? "bg-red-600/20 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                : "bg-emerald-600/20 border-emerald-400 text-white shadow-[0_0_20px_rgba(52,211,153,0.3)]"
            }`}>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{banCheckResult.isBanned ? "🚨" : "🛡️"}</span>
                <div>
                  <div className="text-xs font-gaming font-black tracking-wider uppercase">
                    {banCheckResult.isBanned ? "ACCOUNT IS BANNED / RESTRICTED" : "ACCOUNT IS 100% CLEAN & ACTIVE"}
                  </div>
                  <div className="text-[11px] text-zinc-300 font-mono mt-0.5">
                    {banCheckResult.isBanned ? "Flagged on CarX Anti-Cheat Telemetry" : "Safe for all multiplayer & event lobbies"}
                  </div>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${
                banCheckResult.isBanned ? "bg-red-600 text-white border-red-400" : "bg-emerald-500 text-black border-emerald-300"
              }`}>
                {banCheckResult.statusText || (banCheckResult.isBanned ? "BANNED" : "CLEAN")}
              </span>
            </div>

            {/* Copyable Gmail / Email Box */}
            <div className="bg-black/90 border border-zinc-800 rounded-2xl p-4 space-y-2">
              <span className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>ACCOUNT EMAIL // GMAIL</span>
                <span className="text-zinc-500 font-mono text-[9px]">Click button to copy</span>
              </span>
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700/80">
                <span className="font-mono text-xs font-bold text-amber-300 truncate select-all">
                  {session.email || "No email bound"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (session.email) {
                      navigator.clipboard.writeText(session.email);
                      setCopiedBanEmail(true);
                      setTimeout(() => setCopiedBanEmail(false), 2000);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  {copiedBanEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedBanEmail ? "Copied!" : "Copy Gmail"}
                </button>
              </div>
            </div>

            {/* Reason details */}
            <div className="bg-black/70 border border-zinc-800 rounded-2xl p-4 space-y-1.5">
              <span className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">
                ANTI-CHEAT SERVER RESPONSE
              </span>
              <p className="text-xs font-mono text-zinc-200 leading-relaxed break-words">
                {banCheckResult.banReason || "No anti-cheat violations or active bans found on this account."}
              </p>
            </div>

            {/* Token preview */}
            {banCheckResult.checkedToken && (
              <div className="bg-black/70 border border-zinc-800 rounded-2xl p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-chakra font-bold text-zinc-400 uppercase tracking-wider">
                    PROBED ACTIVE TOKEN
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (banCheckResult.checkedToken) {
                        navigator.clipboard.writeText(banCheckResult.checkedToken);
                        setCopiedBanToken(true);
                        setTimeout(() => setCopiedBanToken(false), 2000);
                      }
                    }}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedBanToken ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedBanToken ? "Copied Token!" : "Copy Token"}
                  </button>
                </div>
                <div className="text-[11px] font-mono text-zinc-400 truncate select-all">
                  {banCheckResult.checkedToken}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setBanModalOpen(false)}
              className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-gaming font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-md"
            >
              CLOSE DIAGNOSTIC
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InjectSite({ adminOverrideToken, hideHeader }: { adminOverrideToken?: string; hideHeader?: boolean } = {}) {
  const { token, clearAuth } = useAuth();
  const [session, setSession] = useState<CarXSession | null>(() => {
    try {
      const saved = localStorage.getItem("connectedCarXSession");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleSetSession = (s: CarXSession | null) => {
    setSession(s);
    try {
      if (s) {
        localStorage.setItem("connectedCarXSession", JSON.stringify(s));
      } else {
        localStorage.removeItem("connectedCarXSession");
      }
    } catch {}
  };

  const userToken = adminOverrideToken || token || "";

  return (
    <div className={hideHeader ? "w-full" : "min-h-screen bg-[#030308] text-white relative overflow-x-hidden selection:bg-amber-500 selection:text-black"}>
      {!hideHeader && (
        <>
          <div className="cyber-grid-container opacity-40" />
          <div className="neon-orb orb-cyan" />
          <div className="neon-orb orb-fuchsia" />
          <div className="neon-orb orb-yellow" />
        </>
      )}

      <div className={`relative z-10 mx-auto transition-all ${session ? "max-w-6xl" : "max-w-2xl"} ${hideHeader ? "py-2" : "px-4 sm:px-6 py-8"}`}>
        {!hideHeader && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-5 border-b border-zinc-800/80">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-500/50 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.35)] bg-black shrink-0 relative group">
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-gaming font-black text-white tracking-wide">
                    <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent">CARX STREET</span>
                    <span className="text-white"> // INJECTOR</span>
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-mono font-bold uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
                <p className="text-xs font-chakra text-zinc-400 mt-0.5">
                  Myanmar CarX Street Community Tool · High-Precision Telemetry Hub
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              <button
                data-testid="button-logout"
                onClick={() => { setSession(null); clearAuth(); }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-red-950/30 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all text-xs font-chakra font-bold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-chakra font-bold border transition-all ${
              session
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "bg-zinc-900/80 border-zinc-800 text-zinc-500"
            }`}>
              <div className={`w-2 h-2 rounded-full ${session ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} />
              {session ? `DRIVER LINKED: ${session.email}` : "DRIVER DISCONNECTED // AWAITING TELEMETRY"}
            </div>
            {session && (
              <button
                onClick={() => handleSetSession(null)}
                className="text-xs font-chakra font-bold text-amber-400 hover:text-amber-300 transition-colors uppercase cursor-pointer flex items-center gap-1"
              >
                ⇄ Switch Account
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!session ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-2xl mx-auto"
              >
                <LoginForm userToken={userToken} onSuccess={handleSetSession} />
              </motion.div>
            ) : (
              <motion.div
                key="injection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <InjectionPanel session={session} userToken={userToken} onDisconnect={() => handleSetSession(null)} onUpdateSession={handleSetSession} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
