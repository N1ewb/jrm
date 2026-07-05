import Link from "next/link";
import Image from "next/image";
import JeepWhite from "../assets/jeep-icon-small-white.png";

function LandingHeader() {
  return (
    <div className="flex items-center gap-2 text-white">
      <Link href="/">
        <Image
          src={JeepWhite}
          alt="JRM"
          width={28}
          height={28}
          className="rounded shrink-0"
        />
        <span className="font-bold text-sm">JRM</span>
      </Link>
      <div className="flex-1" />
      <div className="hidden lg:flex items-center gap-1">
        <Link
          href="/auth/login"
          className="btn btn-ghost text-white text-sm btn-sm"
        >
          Sign In
        </Link>
        <Link
          href="/auth/sign-up"
          className="btn text-sm btn-sm bg-white text-[#250057] hover:bg-white/90 border-none"
        >
          Get Started
        </Link>
      </div>
    </div>
  );
}

export default LandingHeader;
