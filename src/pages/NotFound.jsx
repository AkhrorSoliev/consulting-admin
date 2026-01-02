import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="bg-base-100 min-h-screen flex items-center">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold md:text-4xl text-base-content">
            Etwas fehlt.
          </p>
          <p className="mb-4 text-lg font-light text-base-content/70">
            Entschuldigung, wir können diese Seite nicht finden. Auf der
            Startseite finden Sie viel zu entdecken.
          </p>
          <Link to="/" className="btn btn-primary my-4">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFound;
