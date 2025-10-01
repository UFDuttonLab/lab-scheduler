export const Footer = () => {
  return (
    <footer className="py-4 mt-8 border-t border-border">
      <div className="container mx-auto px-6">
        <p className="text-center text-sm text-muted-foreground">
          Developed by{" "}
          <a 
            href="https://ufduttonlab.github.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-foreground transition-colors underline"
          >
            Dutton Lab at UF
          </a>
          {" • "}
          <span className="text-xs">v1.0.1</span>
        </p>
      </div>
    </footer>
  );
};
