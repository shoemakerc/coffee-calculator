import { Calculator } from "@/components/Calculator";

export default function Home() {
  return (
    <>
      <section className="page-intro">
        <p className="meta">Projects · Coffee Calculator</p>
        <h1 className="page-title">
          Coffee, <em>by the gram.</em>
        </h1>
        <p className="lede">
          Pick a method, set how much you’re making, and follow the pours.
          Change any number and the others follow.
        </p>
      </section>
      <Calculator />
    </>
  );
}
