const programs = [
  { name: "HACKFEST", style: "strong" },
  { name: "CODELAB", style: "mono" },
  { name: "INFORMATICS CUP", style: "wide" },
  { name: "TECHTALK", style: "pixel" },
  { name: "DEVFEST", style: "strong" },
  { name: "UI/UX LAB", style: "wide" },
];

function ProgramLogo({ program }) {
  return (
    <span className={`program-chip program-chip--${program.style}`}>
      {program.name}
    </span>
  );
}

function LogoGroup({ clone = false }) {
  return (
    <span
      aria-hidden={clone ? "true" : undefined}
      className={clone ? "logo-marquee__group logo-marquee__group--clone" : "logo-marquee__group"}
    >
      {programs.map((program) => (
        <ProgramLogo key={program.name} program={program} />
      ))}
    </span>
  );
}

export function LogoMarquee() {
  return (
    <div
      aria-label="Program unggulan HIMANIKA. Arahkan mouse atau fokuskan untuk menghentikan animasi."
      className="logo-marquee"
      role="region"
      tabIndex={0}
    >
      <div className="logo-marquee__track">
        <LogoGroup />
        <LogoGroup clone />
      </div>
    </div>
  );
}
