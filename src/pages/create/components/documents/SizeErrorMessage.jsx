export default function SizeErrorMessage() {
  return (
    <p className="text-error text-sm mt-1">
      Datei &gt; 2 MB. Komprimieren:{" "}
      <a
        className="link link-primary"
        href="https://www.ilovepdf.com/compress_pdf"
        target="_blank"
        rel="noopener noreferrer"
      >
        iLovePDF
      </a>
    </p>
  );
}
