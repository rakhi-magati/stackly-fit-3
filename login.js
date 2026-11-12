const signupTab = document.getElementById("signupTab");
const loginTab = document.getElementById("loginTab");
const title = document.getElementById("formTitle");
const subtitle = document.getElementById("formSubtitle");
const submitButton = document.getElementById("submitButton");
const switchCopy = document.getElementById("switchCopy");
const firstNameField = document.getElementById("firstNameField");
const lastNameField = document.getElementById("lastNameField");
const confirmField = document.getElementById("confirmField");
const signupOptions = document.getElementById("signupOptions");
const loginOptions = document.getElementById("loginOptions");
const password = document.getElementById("password");
const confirmPassword = document.getElementById("confirmPassword");
const togglePassword = document.getElementById("togglePassword");
const email = document.getElementById("email");
const firstName = document.getElementById("firstName");
const lastName = document.getElementById("lastName");
const terms = document.getElementById("terms");
const remember = document.getElementById("remember");
const form = document.getElementById("authForm");
const message = document.getElementById("formMessage");

const USERS_KEY = "stacklyfit-demo-users";
const SESSION_KEY = "stacklyfit-session";
let mode = "signup";

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
        return [];
    }
}

function showMessage(text = "", type = "info") {
    message.textContent = text;
    message.dataset.type = type;
}

function createSession(user, persistent) {
    const session = JSON.stringify({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        signedInAt: Date.now()
    });
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    (persistent ? localStorage : sessionStorage).setItem(SESSION_KEY, session);
}

function redirectHome() {
    window.setTimeout(() => { window.location.href = "index.html"; }, 650);
}

function setMode(nextMode) {
    mode = nextMode;
    const isSignup = mode === "signup";
    document.documentElement.dataset.mode = isSignup ? "signup" : "login";
    document.querySelector(".auth-tabs").classList.toggle("is-signup", isSignup);
    document.getElementById("orText").textContent = isSignup ? "or sign up with" : "or log in with";
    signupTab.classList.toggle("active", isSignup);
    loginTab.classList.toggle("active", !isSignup);
    signupTab.setAttribute("aria-selected", String(isSignup));
    loginTab.setAttribute("aria-selected", String(!isSignup));
    title.textContent = isSignup ? "Create your account" : "Welcome back";
    document.title = (isSignup ? "Sign up" : "Log in") + " — StacklyFit";
    subtitle.textContent = isSignup ? "Start your stronger journey today." : "Log in to continue your journey.";
    submitButton.textContent = isSignup ? "Create account" : "Log in";
    firstNameField.hidden = !isSignup;
    lastNameField.hidden = !isSignup;
    confirmField.hidden = !isSignup;
    signupOptions.hidden = !isSignup;
    loginOptions.hidden = isSignup;
    password.autocomplete = isSignup ? "new-password" : "current-password";
    confirmPassword.value = "";
    switchCopy.innerHTML = isSignup
        ? 'Already have an account? <button type="button" class="inline-link" id="switchLink">Log in</button>'
        : 'Don\'t have an account? <button type="button" class="inline-link" id="switchLink">Sign up</button>';
    document.getElementById("switchLink").addEventListener("click", () => setMode(isSignup ? "login" : "signup"));
    showMessage();
    clearErrors();
    validateForm();
}

function clearErrors() {
    document.querySelectorAll(".field .error").forEach(item => { item.textContent = ""; });
    document.querySelectorAll(".field input").forEach(item => item.removeAttribute("aria-invalid"));
}

function setError(input, text) {
    input.setAttribute("aria-invalid", "true");
    input.closest(".field").querySelector(".error").textContent = text;
}

function clearError(input) {
    input.removeAttribute("aria-invalid");
    input.closest(".field").querySelector(".error").textContent = "";
}

function isEmailValid() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
}

function validateForm() {
    const signupReady = mode === "login" || (
        firstName.value.trim() &&
        lastName.value.trim() &&
        confirmPassword.value === password.value &&
        terms.checked
    );
    submitButton.disabled = !(isEmailValid() && password.value.length >= 8 && signupReady);
}

function validateField(input) {
    if (!input.value) return;
    if (input === email && !isEmailValid()) setError(email, "Enter a valid email address.");
    else if (input === password && password.value.length < 8) setError(password, "Use at least 8 characters.");
    else if (input === confirmPassword && mode === "signup" && confirmPassword.value !== password.value) setError(confirmPassword, "Passwords do not match.");
    else clearError(input);
}

[email, password, confirmPassword, firstName, lastName].forEach(input => {
    input.addEventListener("input", () => {
        validateField(input);
        if (input === password && confirmPassword.value) validateField(confirmPassword);
        validateForm();
    });
    input.addEventListener("blur", () => validateField(input));
});
terms.addEventListener("change", validateForm);

signupTab.addEventListener("click", () => setMode("signup"));
loginTab.addEventListener("click", () => setMode("login"));

togglePassword.addEventListener("click", () => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    togglePassword.setAttribute("aria-pressed", String(!visible));
    togglePassword.setAttribute("aria-label", visible ? "Show password" : "Hide password");
    togglePassword.title = visible ? "Show password" : "Hide password";
});

form.addEventListener("submit", event => {
    event.preventDefault();
    clearErrors();
    showMessage();
    let valid = true;

    if (mode === "signup" && !firstName.value.trim()) { setError(firstName, "Enter your first name."); valid = false; }
    if (mode === "signup" && !lastName.value.trim()) { setError(lastName, "Enter your last name."); valid = false; }
    if (!isEmailValid()) { setError(email, "Enter a valid email address."); valid = false; }
    if (password.value.length < 8) { setError(password, "Use at least 8 characters."); valid = false; }
    if (mode === "signup" && confirmPassword.value !== password.value) { setError(confirmPassword, "Passwords do not match."); valid = false; }
    if (mode === "signup" && !terms.checked) { showMessage("Please agree to the Terms & Conditions to continue.", "error"); valid = false; }
    if (!valid) return;

    const normalizedEmail = email.value.trim().toLowerCase();
    const users = getUsers();

    if (mode === "signup") {
        if (users.some(user => user.email === normalizedEmail)) {
            setError(email, "An account already exists with this email. Log in instead.");
            return;
        }
        const user = { firstName: firstName.value.trim(), lastName: lastName.value.trim(), email: normalizedEmail, password: password.value };
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        createSession(user, true);
        submitButton.disabled = true;
        showMessage("Account created. Taking you home...", "success");
        redirectHome();
        return;
    }

    const user = users.find(item => item.email === normalizedEmail);
    if (!user || user.password !== password.value) {
        setError(password, "Email or password is incorrect.");
        showMessage("Check your login details and try again.", "error");
        return;
    }

    createSession(user, remember.checked);
    submitButton.disabled = true;
    showMessage(`Welcome back, ${user.firstName}. Taking you home...`, "success");
    redirectHome();
});

document.getElementById("forgotButton").addEventListener("click", () => {
    const normalizedEmail = email.value.trim().toLowerCase();
    if (!isEmailValid()) {
        setError(email, "Enter your account email first.");
        return;
    }
    const accountExists = getUsers().some(user => user.email === normalizedEmail);
    showMessage(
        accountExists ? "Password reset is ready for this demo account. Create a new account if you need new credentials." : "No account was found with this email.",
        accountExists ? "info" : "error"
    );
});

document.querySelectorAll(".social-button").forEach(button => {
    button.addEventListener("click", () => {
        const user = { firstName: button.dataset.provider, lastName: "Member", email: `${button.dataset.provider.toLowerCase()}-member@stacklyfit.demo` };
        createSession(user, true);
        showMessage(`Signed in with ${button.dataset.provider}. Taking you home...`, "success");
        redirectHome();
    });
});

setMode(location.hash === "#signup" ? "signup" : "login");
addEventListener("hashchange", () => setMode(location.hash === "#signup" ? "signup" : "login"));