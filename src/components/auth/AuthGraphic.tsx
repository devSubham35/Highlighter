import Image from "next/image";

export function AuthGraphic() {
  return (
    <div className="w-full max-w-[46rem]">
      <Image
        src="/assets/auth_page_graphics.png"
        alt="Bug report annotation preview"
        width={1536}
        height={1024}
        priority
        className="h-auto w-full select-none object-contain"
        sizes="(min-width: 1024px) 46rem, 50vw"
      />
    </div>
  );
}
