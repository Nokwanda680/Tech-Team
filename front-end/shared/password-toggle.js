// Find My Vibe — shared password show/hide toggle
//
// Finds every password input on the page and adds a clickable eye icon
// inside the field: click once to reveal the password (eye-open icon),
// click again to hide it (eye-closed/slashed icon). Self-contained inline
// SVGs are used instead of an icon font/library, since different pages in
// this project load different icon sets (Tabler on the dashboard pages,
// Font Awesome on Login.html, nothing at all on the signup pages) - this
// way the toggle works identically everywhere without depending on
// whatever else happens to be loaded on a given page.
//
// Include this script on any page with a password field - it runs
// automatically on DOMContentLoaded and requires no setup or IDs.

const EYE_OPEN_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>`;

const EYE_CLOSED_SVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a18.5 18.5 0 0 1 4.22-5.06"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 7 11 7a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12A3 3 0 1 1 9.88 9.88"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;

function initPasswordToggles() {
    // input.type is normalized to lowercase by the browser regardless of
    // how the HTML attribute was written (e.g. type="Password"), so this
    // catches every password field without needing the markup fixed first.
    const passwordInputs = Array.from(document.querySelectorAll('input')).filter(
        (input) => input.type === 'password'
    );

    passwordInputs.forEach((input) => {
        if (input.dataset.toggleAttached) return; // avoid double-wrapping on repeat calls
        input.dataset.toggleAttached = 'true';

        // Wrap the input in a positioned container so the icon can sit
        // inside the field without disturbing the page's existing layout.
        // Match the input's own width behaviour: if it's styled to fill
        // its container (the common case in this project's forms), the
        // wrapper does too, so the field doesn't visually shrink.
        const computedWidth = getComputedStyle(input).width;
        const inputRect = input.getBoundingClientRect();
        const parentRect = input.parentElement.getBoundingClientRect();
        const fillsContainer = inputRect.width >= parentRect.width - 2; // small tolerance for borders

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.style.display = fillsContainer ? 'block' : 'inline-block';
        if (fillsContainer) wrapper.style.width = '100%';

        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        // Make room for the icon so it doesn't overlap typed text.
        const existingPaddingRight = parseInt(getComputedStyle(input).paddingRight, 10) || 0;
        input.style.paddingRight = Math.max(existingPaddingRight, 36) + 'px';
        input.style.boxSizing = 'border-box';

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.setAttribute('aria-label', 'Show password');
        toggleBtn.setAttribute('tabindex', '-1'); // keep tab order on the actual field, not the icon
        toggleBtn.innerHTML = EYE_OPEN_SVG;
        toggleBtn.style.position = 'absolute';
        toggleBtn.style.right = '8px';
        toggleBtn.style.top = '50%';
        toggleBtn.style.transform = 'translateY(-50%)';
        toggleBtn.style.background = 'none';
        toggleBtn.style.border = 'none';
        toggleBtn.style.padding = '4px';
        toggleBtn.style.margin = '0';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.display = 'flex';
        toggleBtn.style.alignItems = 'center';
        toggleBtn.style.color = 'inherit';
        toggleBtn.style.opacity = '0.6';
        toggleBtn.addEventListener('mouseenter', () => { toggleBtn.style.opacity = '1'; });
        toggleBtn.addEventListener('mouseleave', () => { toggleBtn.style.opacity = '0.6'; });

        toggleBtn.addEventListener('click', () => {
            const revealing = input.type === 'password';
            input.type = revealing ? 'text' : 'password';
            toggleBtn.innerHTML = revealing ? EYE_CLOSED_SVG : EYE_OPEN_SVG;
            toggleBtn.setAttribute('aria-label', revealing ? 'Hide password' : 'Show password');
        });

        wrapper.appendChild(toggleBtn);
    });
}

document.addEventListener('DOMContentLoaded', initPasswordToggles);
