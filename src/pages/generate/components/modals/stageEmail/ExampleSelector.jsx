export default function ExampleSelector({
  examples,
  selectedExample,
  setSelectedExample,
}) {
  return (
    <div className="bg-base-200/60 border border-base-300 rounded-lg p-4 space-y-3">
      <div className="font-semibold">E-Mail-Inhalt auswählen:</div>
      <div className="space-y-2">
        {examples.map((example) => (
          <label
            key={example.id}
            className={`card border transition cursor-pointer ${
              selectedExample === example.id
                ? "border-primary bg-primary/5"
                : "border-base-300 hover:border-primary/60"
            }`}
          >
            <div className="card-body p-3 gap-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="example-selection"
                  className="radio radio-primary"
                  value={example.id}
                  checked={selectedExample === example.id}
                  onChange={() => setSelectedExample?.(example.id)}
                />
                <div className="font-semibold text-sm">
                  {example.title}
                </div>
              </div>
              {/* content hidden intentionally */}
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
