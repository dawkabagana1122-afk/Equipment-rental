import { useState, type FormEvent } from "react";
import { api } from "./lib/api";

const assetPathPrefix = "/assets";
const imgScanLine = `${assetPathPrefix}/cc583.svg`;
const imgDot = `${assetPathPrefix}/mobile-510a9.svg`;
const imgHardHat = `${assetPathPrefix}/9627e.svg`;
const imgBriefcaseBusiness = `${assetPathPrefix}/7a1ea.svg`;
const imgEyeOff = `${assetPathPrefix}/bd00d.svg`;
const imgArrowRight = `${assetPathPrefix}/18191.svg`;
const imgShieldCheck = `${assetPathPrefix}/afd3d.svg`;

type Role = "manager" | "fixer" | "renter";

const roles = [
  {
    id: "manager" as const,
    title: "Менежер",
    description: "Тайлан, төлөв, захиалга, удирдлага",
    icon: imgBriefcaseBusiness,
  },
  {
    id: "fixer" as const,
    title: "Фиксер",
    description: "Төхөөрөмж, QR, засвар, telemetry",
    icon: imgHardHat,
  },
  {
    id: "renter" as const,
    title: "Түрээслэгч",
    description: "Гэрээ, төлбөр, тоног төхөөрөмжийн хяналт",
    icon: imgShieldCheck,
  },
];

export default function MobileLogin({
  onLogin,
}: {
  onLogin?: (result: {
    message: string;
    user: {
      id: string;
      role: Role;
      phone: string;
      name: string;
      company: string;
    };
    session: {
      token: string;
      role: Role;
      expiresAt: string;
    };
  }) => void;
}) {
  const [role, setRole] = useState<Role>("manager");
  const [phone, setPhone] = useState("9912 8044");
  const [code, setCode] = useState("123456");
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const result = await api.login({
        role,
        phone: phone.replace(/\D/g, ""),
        code,
      });

      onLogin?.(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Нэвтрэх үед алдаа гарлаа.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main
      className="flex min-h-dvh w-full flex-col bg-[#eef2f4]"
      data-name="Нэвтрэх дэлгэц"
      data-node-id="5:17896"
    >
      <section
        className="flex min-h-[250px] w-full shrink-0 flex-col items-start justify-end overflow-hidden bg-[#101c25] px-[24px] pb-[24px]"
        data-name="Hero"
        data-node-id="5:17897"
      >
        <div
          className="flex w-full shrink-0 flex-col items-start gap-[14px] overflow-hidden"
          data-name="Brand"
          data-node-id="5:17904"
        >
          <div
            className="flex size-[48px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#1677a8]"
            data-name="Brand mark"
            data-node-id="5:17905"
          >
            <img alt="" className="size-[25px]" src={imgScanLine} />
          </div>
          <p className="font-['Inter:Bold'] text-[12px] font-bold whitespace-nowrap text-[#e2f1f7]">
            ТҮРЭЭС OPS · MOBILE
          </p>
          <h1 className="w-full font-['Inter:Bold'] text-[29px] leading-[1.12] font-bold text-white">
            Талбай дээрх түрээсийг нэг дор удирд
          </h1>
          <div className="flex shrink-0 items-center gap-[7px] overflow-hidden">
            <div className="flex shrink-0 items-center gap-[5px] overflow-hidden rounded-full bg-[#e3f3ec] px-[8px] py-[5px]">
              <img alt="" className="size-[6px]" src={imgDot} />
              <span className="font-['Inter:Bold'] text-[10px] font-bold whitespace-nowrap text-[#238a62]">
                MQTT ONLINE
              </span>
            </div>
            <span className="font-['Inter:Regular'] text-[10px] whitespace-nowrap text-[#91a0aa]">
              Синк: 8 сек өмнө
            </span>
          </div>
        </div>
      </section>

      <form
        className="flex w-full flex-1 flex-col items-start gap-[14px] bg-white p-[20px]"
        onSubmit={handleSubmit}
      >
        <h2 className="w-full font-['Inter:Bold'] text-[20px] font-bold text-[#14212a]">
          Хэрэглэгчийн төрөл
        </h2>
        <p className="w-full font-['Inter:Regular'] text-[12px] leading-[1.45] text-[#667784]">
          Өөрийн ажлын урсгалд тохирох эрхээр үргэлжлүүлнэ үү.
        </p>

        <div className="flex w-full shrink-0 items-start gap-[10px]">
          {roles.map((item) => {
            const selected = role === item.id;

            return (
              <button
                aria-pressed={selected}
                className={`flex h-[104px] min-w-0 flex-1 flex-col items-start gap-[8px] overflow-hidden rounded-[10px] p-[12px] text-left transition-colors ${
                  selected
                    ? "border-2 border-[#1677a8] bg-[#e2f1f7]"
                    : "border border-[#d6dfe4] bg-[#f6f8f9]"
                }`}
                key={item.id}
                onClick={() => setRole(item.id)}
                type="button"
              >
                <img alt="" className="size-[22px] shrink-0" src={item.icon} />
                <span className="font-['Inter:Bold'] text-[13px] font-bold whitespace-nowrap text-[#14212a]">
                  {item.title}
                </span>
                <span className="w-full font-['Inter:Regular'] text-[10px] leading-[1.3] text-[#667784]">
                  {item.description}
                </span>
              </button>
            );
          })}
        </div>

        <label className="flex w-full shrink-0 flex-col items-start gap-[6px]">
          <span className="font-['Inter:Bold'] text-[11px] font-bold whitespace-nowrap text-[#667784]">
            УТАСНЫ ДУГААР
          </span>
          <span className="flex h-[48px] w-full items-center gap-[10px] overflow-hidden rounded-[6px] border border-[#d6dfe4] px-[13px] focus-within:border-[#1677a8]">
            <span className="shrink-0 font-['Roboto_Mono:Bold'] text-[13px] font-bold whitespace-nowrap text-[#14212a]">
              +976
            </span>
            <span className="h-[20px] w-px shrink-0 bg-[#d6dfe4]" />
            <input
              aria-label="Утасны дугаар"
              className="min-w-0 flex-1 bg-transparent font-['Roboto_Mono:Regular'] text-[13px] text-[#14212a] outline-none"
              inputMode="numeric"
              onChange={(event) => setPhone(event.target.value)}
              value={phone}
            />
          </span>
        </label>

        <label className="flex w-full shrink-0 flex-col items-start gap-[6px]">
          <span className="font-['Inter:Bold'] text-[11px] font-bold whitespace-nowrap text-[#667784]">
            НЭВТРЭХ КОД
          </span>
          <span className="flex h-[48px] w-full items-center justify-between overflow-hidden rounded-[6px] border border-[#d6dfe4] px-[13px] focus-within:border-[#1677a8]">
            <input
              aria-label="Нэвтрэх код"
              className="min-w-0 flex-1 bg-transparent font-['Roboto_Mono:Regular'] text-[18px] tracking-[0.14em] text-[#14212a] outline-none"
              inputMode="numeric"
              onChange={(event) => setCode(event.target.value)}
              type={showCode ? "text" : "password"}
              value={code}
            />
            <button
              aria-label={showCode ? "Код нуух" : "Код харуулах"}
              className="flex size-[32px] shrink-0 items-center justify-end"
              onClick={() => setShowCode((visible) => !visible)}
              type="button"
            >
              <img alt="" className="size-[18px]" src={imgEyeOff} />
            </button>
          </span>
        </label>

        {error && (
          <p className="w-full rounded-[8px] bg-[#fff1f0] px-[10px] py-[8px] font-['Inter:Regular'] text-[10px] text-[#cc524c]">
            {error}
          </p>
        )}

        <button
          className="flex h-[52px] w-full shrink-0 items-center justify-center gap-[8px] overflow-hidden rounded-[10px] border border-[#1677a8] bg-[#1677a8] px-[16px] transition-colors hover:bg-[#12658f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1677a8] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isSubmitting}
          type="submit"
        >
          <img alt="" className="size-[20px]" src={imgArrowRight} />
          <span className="font-['Inter:Bold'] text-[14px] font-bold whitespace-nowrap text-white">
            {isSubmitting
              ? "Нэвтэрч байна..."
              : role === "manager"
                ? "Менежерээр нэвтрэх"
                : role === "fixer"
                  ? "Фиксерээр нэвтрэх"
                  : "Түрээслэгчээр нэвтрэх"}
          </span>
        </button>

        <div className="flex w-full items-center justify-center gap-[7px]">
          <img alt="" className="size-[15px]" src={imgShieldCheck} />
          <p className="font-['Inter:Regular'] text-[10px] whitespace-nowrap text-[#667784]">
            Байгууллагын төхөөрөмж · Нууцлал хамгаалагдсан
          </p>
        </div>
      </form>
    </main>
  );
}
