import Prism from "prismjs";
import "prismjs/themes/prism.css";
// Add language components
import "prismjs/components/prism-json";
import "prismjs/components/prism-bash";
import "prismjs/plugins/copy-to-clipboard/prism-copy-to-clipboard";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/plugins/line-numbers/prism-line-numbers";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "./style.css";
import { generateResponse } from "./index.ts";

// Get DOM elements index.html main element
const app = document.querySelector<HTMLDivElement>("#app")!;

// Create header element
const header = document.createElement("header");
header.innerHTML = `
  <h1>AI Assistant</h1>
  <p class="subtitle">Powered by Gemini AI - Ask me anything!</p>
`;

// Create main element
const main = document.createElement("main");
main.id = "main-content";
main.className = "main-content";

// Create a footer element
const disclaimer = document.createElement("footer");
disclaimer.className = "disclaimer";
disclaimer.innerHTML = `
    <p>
        <small>Note: This AI assistant may occasionally generate incorrect information. Verify important facts.</small>
    </p>
    <p>
        <small>© 2025. All rights reserved. Visit us at
             <a href="http://preprince.co.za" target="_blank" rel="noopener noreferrer">preprince.co.za</a>.    
         </small>
    </p>
`;

// theme toggle
const createThemeToggle = () => {
    const toggle = document.createElement("button");
    toggle.id = "theme-toggle";
    toggle.className = "theme-toggle";
    toggle.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8V16Z" fill="currentColor"/>
      <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2ZM12 4V20C7.58172 20 4 16.4183 4 12C4 7.58172 7.58172 4 12 4Z" fill="currentColor"/>
    </svg>
    <span class="sr-only">Toggle theme to either light or dark mode</span>
  `;

    // Check for saved preference or use system preference
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).matches;
    const currentTheme = savedTheme ?? (systemPrefersDark ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", currentTheme);

    toggle.addEventListener("click", () => {
        const newTheme =
            document.documentElement.getAttribute("data-theme") === "dark"
                ? "light"
                : "dark";
        document.documentElement.setAttribute("data-theme", newTheme);
        localStorage.setItem("theme", newTheme);
    });

    return toggle;
};

app.appendChild(main);

// Add this before your form creation
main.prepend(createThemeToggle());

const form = document.createElement("form");
form.setAttribute("aria-live", "polite");

const input = document.createElement("input");
const submitButton = document.createElement("button");

const label = document.createElement("label");
label.htmlFor = "prompt-input";
label.textContent = "Ask your question";
label.className = "sr-only"; // Screen reader only

// Set up the form
form.id = "prompt-form";
form.className = "prompt-form";
input.type = "text";
input.id = "prompt-input";
input.className = "prompt-input";
input.setAttribute("aria-required", "true");
input.setAttribute("aria-describedby", "input-help");
input.placeholder = "Ask a question...";
input.required = true;
submitButton.textContent = "Submit";
submitButton.className = "prompt-submit";

// Add this right after app.prepend(createThemeToggle())

app.prepend(header);

// Append elements to the form and app
form.appendChild(label);
form.appendChild(input);
form.appendChild(submitButton);
main.appendChild(form);

const responseContainer = document.createElement("div");
responseContainer.id = "response-container";
const loadingIndicator = document.createElement("div");
loadingIndicator.id = "loading-indicator";
loadingIndicator.className = "loading-hidden";
main.append(responseContainer, loadingIndicator);
app.append(disclaimer); // Append the disclaimer to the app : footer
// Handle form submission
document
    .getElementById("prompt-form")
    ?.addEventListener("submit", async (e) => {
        e.preventDefault();
        submitButton.disabled = true;
        form.setAttribute("aria-busy", "true");
        const inputElement = document.getElementById(
            "prompt-input"
        ) as HTMLInputElement;
        const prompt = inputElement.value.trim();
        const loadingIndicator = document.getElementById("loading-indicator")!;
        loadingIndicator.id = "loading-indicator";
        loadingIndicator.setAttribute("role", "status");
        loadingIndicator.setAttribute("aria-live", "polite");
        // loadingIndicator.textContent = "Loading response..."; // Visible or SR-only

        const responseContainer =
            document.getElementById("response-container")!;

        if (!prompt) return;

        try {
            // Show loading state
            loadingIndicator.classList.remove("loading-hidden");
            loadingIndicator.classList.add("loading-visible");
            responseContainer.innerHTML = "";

            const response = await generateResponse(prompt);
            // Hide loading state
            loadingIndicator.classList.remove("loading-visible");
            loadingIndicator.classList.add("loading-hidden");

            // Show response
            responseContainer.innerHTML = `
            <div class="response">
                 <div class="ai-branding">
                    <span class="ai-icon">🤖</span>
                    <h2 class="response-heading">AI Response</h2>
                    
                </div>
                <h3 class="response-sub-heading">${prompt}</h3>
                  ${formatResponse(response)}
                   <div class="ai-footer">
                     <small>Response generated by AI at ${new Date().toLocaleTimeString()}</small>
                    </div>
            </div>
        `;

            requestAnimationFrame(() => {
                Prism.highlightAllUnder(responseContainer);
            });
        } catch (error) {
            // Hide loading state on error too
            loadingIndicator.classList.remove("loading-visible");
            loadingIndicator.classList.add("loading-hidden");

            console.error("Error generating response:", error);
            const errorMessage =
                error instanceof Error ? error.message : "Request failed";

            responseContainer.innerHTML = `
           <div class="error" role="alert" aria-live="assertive">
             Error: ${errorMessage}
          </div>
           `;
        } finally {
            submitButton.disabled = false;
            form.removeAttribute("aria-busy");
        }
        // Clear input after submission
        inputElement.value = "";
    });

// Update formatResponse function
function formatResponse(text: string): string {
    return (
        text
            // Process code blocks
            .replace(/```(\w+)?\n([\s\S]*?)\n```/g, (_, lang, code) => {
                const language = lang || "text";
                return `<pre class="language-${language} line-numbers"><code>${escapeHtml(
                    code
                )}</code></pre>`;
            })
            // Process inline code
            .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
            // Preserve paragraphs
            .replace(/\n\n+/g, "</p><p>")
            .replace(/\n/g, "<br>")
    );
}

function escapeHtml(unsafe: string): string {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
