export function Toaster() {
  return (
    <div className="fixed bottom-4 right-4">
      {/* Toast notifications will be rendered here */}
      <div className="bg-background border rounded-md p-4 shadow-lg">
        <p>Toast notification</p>
      </div>
    </div>
  );
}
