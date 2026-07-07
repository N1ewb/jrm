import Link from "next/link";
import Image from "next/image";
import UserDropdown from "@/components/user-dropdown";
import JeepWhite from "@/app/assets/jeep-icon-small-white.png";

export function Header() {
  return (
    <div className="navbar bg-[#250057] w-full">
      <div className="flex items-center gap-2 px-2 text-white">
        <Image
          src={JeepWhite}
          alt="JRM"
          width={28}
          height={28}
          className="rounded"
        />
        <Link href="/" className="font-bold text-sm">
          JRM
        </Link>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <UserDropdown />
      </div>
    </div>
  );
}
