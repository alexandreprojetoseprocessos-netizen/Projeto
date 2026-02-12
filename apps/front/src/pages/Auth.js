import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, User, ArrowRight, Sparkles, FileText } from "lucide-react";
const normalizeEmail = (value) => value.trim().toLowerCase();
const stripDocument = (value) => value.replace(/\D/g, "");
const formatCpf = (value) => {
    const digits = stripDocument(value).slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};
const formatCnpj = (value) => {
    const digits = stripDocument(value).slice(0, 14);
    return digits
        .replace(/(\d{2})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1/$2")
        .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};
const isRepeatedDigits = (value) => /^(\d)\1+$/.test(value);
const validateCpf = (raw) => {
    const cpf = stripDocument(raw);
    if (cpf.length !== 11 || isRepeatedDigits(cpf))
        return false;
    let sum = 0;
    for (let i = 0; i < 9; i += 1) {
        sum += Number(cpf[i]) * (10 - i);
    }
    let check = (sum * 10) % 11;
    if (check === 10)
        check = 0;
    if (check !== Number(cpf[9]))
        return false;
    sum = 0;
    for (let i = 0; i < 10; i += 1) {
        sum += Number(cpf[i]) * (11 - i);
    }
    check = (sum * 10) % 11;
    if (check === 10)
        check = 0;
    return check === Number(cpf[10]);
};
const validateCnpj = (raw) => {
    const cnpj = stripDocument(raw);
    if (cnpj.length !== 14 || isRepeatedDigits(cnpj))
        return false;
    const calcCheck = (length) => {
        let sum = 0;
        let pos = length - 7;
        for (let i = length; i >= 1; i -= 1) {
            sum += Number(cnpj[length - i]) * pos;
            pos -= 1;
            if (pos < 2)
                pos = 9;
        }
        const result = sum % 11;
        return result < 2 ? 0 : 11 - result;
    };
    const check1 = calcCheck(12);
    const check2 = calcCheck(13);
    return check1 === Number(cnpj[12]) && check2 === Number(cnpj[13]);
};
const isEmailValid = (value) => /\S+@\S+\.\S+/.test(value);
const isPasswordStrong = (value) => {
    if (value.length < 8)
        return false;
    if (!/[A-Za-z]/.test(value))
        return false;
    if (!/\d/.test(value))
        return false;
    return true;
};
function usePlanFromQuery() {
    const { search } = useLocation();
    return useMemo(() => {
        const p = new URLSearchParams(search).get("plan");
        if (!p)
            return null;
        const upper = p.toUpperCase();
        if (upper === "START" || upper === "BUSINESS" || upper === "ENTERPRISE")
            return upper;
        return null;
    }, [search]);
}
const inputClassName = "w-full h-11 rounded-lg border border-slate-200 bg-[#eef5ff] px-3 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none";
const Auth = () => {
    const navigate = useNavigate();
    const { signIn, signUp, error: authError } = useAuth();
    const plan = usePlanFromQuery();
    const [tab, setTab] = useState("login");
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [fullName, setFullName] = useState("");
    const [corporateEmail, setCorporateEmail] = useState("");
    const [personalEmail, setPersonalEmail] = useState("");
    const [documentType, setDocumentType] = useState("CPF");
    const [documentNumber, setDocumentNumber] = useState("");
    const [signupPassword, setSignupPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [startMode, setStartMode] = useState("NEW_ORG");
    const [organizationName, setOrganizationName] = useState("");
    const [inviteToken, setInviteToken] = useState("");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const planLabelMap = {
        START: "Start",
        BUSINESS: "Business",
        ENTERPRISE: "Enterprise"
    };
    const selectedPlanLabel = plan ? planLabelMap[plan] ?? plan : null;
    useEffect(() => {
        if (plan) {
            window.localStorage.setItem("gp:selectedPlan", plan);
        }
    }, [plan]);
    useEffect(() => {
        setDocumentNumber((current) => (documentType === "CPF" ? formatCpf(current) : formatCnpj(current)));
    }, [documentType]);
    const validateSignupForm = (mode) => {
        const errors = {};
        const trimmedFullName = fullName.trim();
        const trimmedCorporateEmail = corporateEmail.trim();
        const trimmedPersonalEmail = personalEmail.trim();
        const normalizedDocument = stripDocument(documentNumber);
        const trimmedOrganizationName = organizationName.trim();
        const trimmedInviteToken = inviteToken.trim();
        if (!trimmedFullName) {
            errors.fullName = "Informe seu nome completo.";
        }
        if (!trimmedCorporateEmail || !isEmailValid(trimmedCorporateEmail)) {
            errors.corporateEmail = "Informe um e-mail corporativo vÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â¡lido.";
        }
        if (!trimmedPersonalEmail || !isEmailValid(trimmedPersonalEmail)) {
            errors.personalEmail = "Informe um e-mail pessoal vÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â¡lido.";
        }
        if (trimmedCorporateEmail &&
            trimmedPersonalEmail &&
            normalizeEmail(trimmedCorporateEmail) === normalizeEmail(trimmedPersonalEmail)) {
            errors.email = "Os e-mails corporativo e pessoal precisam ser diferentes.";
        }
        if (!documentType) {
            errors.documentType = "Selecione o tipo de documento.";
        }
        if (!normalizedDocument) {
            errors.documentNumber = "Informe o nÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Âºmero do documento.";
        }
        else if (documentType === "CPF" && !validateCpf(documentNumber)) {
            errors.documentNumber = "CPF invÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â¡lido.";
        }
        else if (documentType === "CNPJ" && !validateCnpj(documentNumber)) {
            errors.documentNumber = "CNPJ invÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â¡lido.";
        }
        if (!signupPassword.trim()) {
            errors.password = "Informe uma senha.";
        }
        else if (!isPasswordStrong(signupPassword)) {
            errors.password = "Senha fraca. Use no mÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â­nimo 8 caracteres, com letras e nÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Âºmeros.";
        }
        if (!confirmPassword.trim()) {
            errors.confirmPassword = "Confirme a sua senha.";
        }
        else if (signupPassword !== confirmPassword) {
            errors.confirmPassword = "As senhas nÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â£o conferem.";
        }
        if (mode === "NEW_ORG" && !trimmedOrganizationName) {
            errors.organizationName = "Informe o nome da organização.";
        }
        if (mode === "INVITE" && !trimmedInviteToken) {
            errors.inviteToken = "Informe o cÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â†ÃƒÂ‚Ã‚Â’ÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚ÂƒÃƒÂƒÃ‚Â¢ÃƒÂ‚Ã‚Â€ÃƒÂ‚Ã‚ÂšÃƒÂƒÃ‚ÂƒÃƒÂ‚Ã‚Â‚ÃƒÂƒÃ‚Â‚ÃƒÂ‚Ã‚Â³digo do convite.";
        }
        if (!acceptedTerms) {
            errors.terms = "Aceite os termos para continuar.";
        }
        return Object.keys(errors).length ? errors : null;
    };
    const realLogin = async () => {
        await signIn(normalizeEmail(email), password);
    };
    const realSignup = async () => {
        const payload = {
            fullName: fullName.trim(),
            corporateEmail: normalizeEmail(corporateEmail),
            personalEmail: normalizeEmail(personalEmail),
            documentType,
            documentNumber: stripDocument(documentNumber),
            password: signupPassword,
            startMode,
            organizationName: startMode === "NEW_ORG" ? organizationName.trim() : undefined,
            inviteToken: startMode === "INVITE" ? inviteToken.trim() : undefined
        };
        await signUp(payload);
    };
    const realResetPassword = async () => {
        await supabase.auth.resetPasswordForEmail(normalizeEmail(email), {
            redirectTo: `${window.location.origin}/auth`
        });
    };
    const realOAuthGoogle = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: `${window.location.origin}/auth` }
        });
    };
    const realOAuthMicrosoft = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "azure",
            options: { redirectTo: `${window.location.origin}/auth` }
        });
    };
    const handleLogin = async (event) => {
        event.preventDefault();
        if (!email.trim() || !password.trim()) {
            setLocalError("Informe seu e-mail corporativo e senha.");
            return;
        }
        setIsLoading(true);
        setLocalError(null);
        try {
            await realLogin();
            navigate("/dashboard", { replace: true });
        }
        catch (err) {
            setLocalError(err?.message ?? "Verifique suas credenciais e tente novamente.");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSignup = async (event) => {
        event.preventDefault();
        setIsLoading(true);
        setLocalError(null);
        const errors = validateSignupForm(startMode);
        if (errors) {
            const [firstError] = Object.values(errors);
            if (firstError)
                setLocalError(firstError);
            setIsLoading(false);
            return;
        }
        try {
            await realSignup();
            navigate("/checkout", { replace: true });
        }
        catch (err) {
            setLocalError(err?.message ?? "Confira os dados e tente novamente.");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleForgotPassword = async () => {
        if (!email.trim()) {
            setLocalError("Informe seu email para recuperar a senha.");
            return;
        }
        setIsLoading(true);
        setLocalError(null);
        try {
            await realResetPassword();
        }
        catch (err) {
            setLocalError(err?.message ?? "Tente novamente em instantes.");
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleGoogle = async () => {
        setIsLoading(true);
        setLocalError(null);
        try {
            await realOAuthGoogle();
        }
        catch (err) {
            setLocalError(err?.message ?? "Falha ao entrar com Google.");
            setIsLoading(false);
        }
    };
    const handleMicrosoft = async () => {
        setIsLoading(true);
        setLocalError(null);
        try {
            await realOAuthMicrosoft();
        }
        catch (err) {
            setLocalError(err?.message ?? "Falha ao entrar com Microsoft.");
            setIsLoading(false);
        }
    };
    const displayedError = localError ?? authError ?? null;
    const documentPlaceholder = documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00";
    return (_jsxs("div", { className: "relative min-h-screen overflow-hidden bg-slate-50 flex items-center justify-center px-4", children: [_jsxs("div", { className: "auth-bg", "aria-hidden": "true", children: [_jsx("div", { className: "auth-bg__veil" }), _jsx("div", { className: "auth-bg__item layer-dash", children: _jsx("div", { className: "auth-bg__float", children: _jsx("img", { className: "auth-bg__image", src: "/login/dash.png", alt: "" }) }) }), _jsx("div", { className: "auth-bg__item layer-cronograma", children: _jsx("div", { className: "auth-bg__float", children: _jsx("img", { className: "auth-bg__image", src: "/login/cronograma.png", alt: "" }) }) }), _jsx("div", { className: "auth-bg__item layer-kanban", children: _jsx("div", { className: "auth-bg__float", children: _jsx("img", { className: "auth-bg__image", src: "/login/kanban.png", alt: "" }) }) }), _jsx("div", { className: "auth-bg__item layer-projeto", children: _jsx("div", { className: "auth-bg__float", children: _jsx("img", { className: "auth-bg__image", src: "/login/projeto.png", alt: "" }) }) }), _jsx("div", { className: "auth-bg__item layer-prioridade", children: _jsx("div", { className: "auth-bg__float", children: _jsx("img", { className: "auth-bg__image", src: "/login/prioridade.png", alt: "" }) }) }), _jsx("div", { className: "auth-bg__item layer-progresso", children: _jsx("div", { className: "auth-bg__float", children: _jsx("img", { className: "auth-bg__image", src: "/login/progresso.png", alt: "" }) }) }), _jsx("div", { className: "auth-bg__item layer-orcamento", children: _jsx("div", { className: "auth-bg__float", children: _jsx("img", { className: "auth-bg__image", src: "/login/or%C3%A7amento.png", alt: "" }) }) }), _jsx("div", { className: "auth-bg__item layer-eap", children: _jsx("div", { className: "auth-bg__float", children: _jsx("img", { className: "auth-bg__image", src: "/login/eap.png", alt: "" }) }) })] }), _jsxs("div", { className: "relative z-10 w-full max-w-[460px]", children: [_jsxs(Link, { to: "/", className: "flex items-center justify-center gap-3 mb-8", children: [_jsx("img", { src: "/logo.png", alt: "G&P", className: "h-9 w-9 rounded-xl object-contain shadow-md" }), _jsx("span", { className: "text-2xl font-bold text-slate-900", children: "Gest\u00E3o de Projetos" })] }), _jsxs(Card, { className: "auth-login-card bg-white border border-slate-200 shadow-lg rounded-2xl", children: [_jsxs(CardHeader, { className: "text-center pb-4", children: [_jsx("h2", { className: "text-2xl font-semibold text-slate-900", children: "Bem-vindo de volta" }), _jsxs("p", { className: "text-sm text-slate-500", children: ["Entre na sua conta ou crie uma nova", selectedPlanLabel ? (_jsxs("span", { className: "block mt-2 text-xs text-slate-500", children: ["Plano selecionado: ", _jsx("b", { children: selectedPlanLabel })] })) : null] })] }), _jsxs(CardContent, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] p-[7px] mb-6 shadow-[0_6px_18px_rgba(0,0,0,0.06)]", children: [_jsx("button", { type: "button", onClick: () => setTab("login"), className: `rounded-full h-10 px-6 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${tab === "login"
                                                    ? "auth-tab-active shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                                                    : "bg-[#F3F4F6] text-slate-500 border border-[#E5E7EB] hover:bg-white/70"}`, children: "Entrar" }), _jsx("button", { type: "button", onClick: () => setTab("signup"), className: `rounded-full h-10 px-6 text-sm font-semibold transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 ${tab === "signup"
                                                    ? "auth-tab-active shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                                                    : "bg-[#F3F4F6] text-slate-500 border border-[#E5E7EB] hover:bg-white/70"}`, children: "Cadastrar" })] }), tab === "login" ? (_jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "email", className: "text-sm font-medium text-slate-700", children: "Email corporativo" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { id: "email", type: "email", placeholder: "nome@empresa.com", className: `${inputClassName} pl-10`, value: email, onChange: (event) => setEmail(event.target.value), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "password", className: "text-sm font-medium text-slate-700", children: "Senha" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { id: "password", type: "password", placeholder: "\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00AC\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00AC\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00AC\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00AC\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00AC\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00AC\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00AC\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00AC\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00A2", className: `${inputClassName} pl-10`, value: password, onChange: (event) => setPassword(event.target.value), required: true })] })] }), _jsxs("div", { className: "auth-remember-row", children: [_jsxs("label", { className: "flex items-center gap-2 text-sm text-slate-500/80", children: [_jsx("input", { type: "checkbox", checked: rememberMe, onChange: (event) => setRememberMe(event.target.checked), className: "h-4 w-4 rounded border-slate-300 text-blue-600 translate-y-[1px]" }), "Lembrar de mim"] }), _jsx("button", { type: "button", onClick: handleForgotPassword, className: "auth-forgot-button", children: "Esqueceu a senha?" })] }), _jsx(Button, { type: "submit", className: "w-full h-12 rounded-xl auth-primary-button text-white font-semibold disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-0", disabled: isLoading, children: isLoading ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" }), "Entrando..."] })) : (_jsxs("div", { className: "flex items-center gap-2", children: ["Entrar ", _jsx(ArrowRight, { className: "w-4 h-4" })] })) })] })) : (_jsxs("form", { onSubmit: handleSignup, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "name", className: "text-sm font-medium text-slate-700", children: "Nome completo" }), _jsxs("div", { className: "relative", children: [_jsx(User, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { id: "name", type: "text", placeholder: "Seu nome", className: `${inputClassName} pl-10`, value: fullName, onChange: (event) => setFullName(event.target.value), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "signup-email", className: "text-sm font-medium text-slate-700", children: "E-mail corporativo" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { id: "signup-email", type: "email", placeholder: "nome@empresa.com", className: `${inputClassName} pl-10`, value: corporateEmail, onChange: (event) => setCorporateEmail(event.target.value), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "signup-personal-email", className: "text-sm font-medium text-slate-700", children: "E-mail pessoal" }), _jsxs("div", { className: "relative", children: [_jsx(Mail, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { id: "signup-personal-email", type: "email", placeholder: "nome@gmail.com", className: `${inputClassName} pl-10`, value: personalEmail, onChange: (event) => setPersonalEmail(event.target.value), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("label", { htmlFor: "signup-document", className: "text-sm font-medium text-slate-700", children: "Documento" }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-slate-600", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: "document-type", value: "CPF", checked: documentType === "CPF", onChange: () => setDocumentType("CPF"), className: "h-4 w-4 text-blue-600" }), _jsx("span", { children: "CPF" })] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: "document-type", value: "CNPJ", checked: documentType === "CNPJ", onChange: () => setDocumentType("CNPJ"), className: "h-4 w-4 text-blue-600" }), _jsx("span", { children: "CNPJ" })] })] })] }), _jsxs("div", { className: "relative", children: [_jsx(FileText, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { id: "signup-document", type: "text", inputMode: "numeric", placeholder: documentPlaceholder, className: `${inputClassName} pl-10`, value: documentNumber, onChange: (event) => setDocumentNumber(documentType === "CPF"
                                                                    ? formatCpf(event.target.value)
                                                                    : formatCnpj(event.target.value)), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "signup-password", className: "text-sm font-medium text-slate-700", children: "Senha" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { id: "signup-password", type: "password", placeholder: "M\u00EDnimo 8 caracteres", className: `${inputClassName} pl-10`, value: signupPassword, onChange: (event) => setSignupPassword(event.target.value), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "signup-confirm-password", className: "text-sm font-medium text-slate-700", children: "Confirme a senha" }), _jsxs("div", { className: "relative", children: [_jsx(Lock, { className: "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { id: "signup-confirm-password", type: "password", placeholder: "Repita sua senha", className: `${inputClassName} pl-10`, value: confirmPassword, onChange: (event) => setConfirmPassword(event.target.value), required: true })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "text-sm font-medium text-slate-700", children: "Como voc\u00EA quer come\u00E7ar?" }), _jsxs("div", { className: "flex flex-col gap-2 text-sm text-slate-600", children: [_jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: "organization-mode", value: "NEW_ORG", checked: startMode === "NEW_ORG", onChange: () => setStartMode("NEW_ORG"), className: "h-4 w-4 text-blue-600" }), "Criar nova organiza\u00E7\u00E3o"] }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("input", { type: "radio", name: "organization-mode", value: "INVITE", checked: startMode === "INVITE", onChange: () => setStartMode("INVITE"), className: "h-4 w-4 text-blue-600" }), "Entrar em uma organiza\u00E7\u00E3o existente (convite)"] })] })] }), startMode === "NEW_ORG" ? (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "org-name", className: "text-sm font-medium text-slate-700", children: "Nome da organiza\u00E7\u00E3o" }), _jsx("input", { id: "org-name", type: "text", placeholder: "Ex: Empresa Exemplo", className: inputClassName, value: organizationName, onChange: (event) => setOrganizationName(event.target.value), required: true })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsx("label", { htmlFor: "invite-token", className: "text-sm font-medium text-slate-700", children: "C\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u2020\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u2019\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u00A2\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u20AC\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u0161\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u0192\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u0192\u00C3\u201A\u00C2\u201A\u00C3\u0192\u00C2\u201A\u00C3\u201A\u00C2\u00B3digo do convite" }), _jsx("input", { id: "invite-token", type: "text", placeholder: "Cole aqui o token do convite", className: inputClassName, value: inviteToken, onChange: (event) => setInviteToken(event.target.value), required: true }), _jsx("span", { className: "text-xs text-slate-400", children: "Pe\u00E7a ao administrador o convite da organiza\u00E7\u00E3o." })] })), _jsxs("label", { className: "flex items-start gap-2 text-sm text-slate-500", children: [_jsx("input", { type: "checkbox", checked: acceptedTerms, onChange: (event) => setAcceptedTerms(event.target.checked), className: "mt-1 h-4 w-4 rounded border-slate-300 text-blue-600", required: true }), "Concordo com os", " ", _jsx(Link, { to: "#", className: "text-blue-600 hover:text-blue-700", children: "Termos de Servi\u00E7o" }), " ", "e", " ", _jsx(Link, { to: "#", className: "text-blue-600 hover:text-blue-700", children: "Pol\u00EDtica de Privacidade" })] }), _jsx(Button, { type: "submit", className: "w-full h-12 rounded-xl auth-primary-button text-white font-semibold disabled:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-0", disabled: isLoading || !acceptedTerms, children: isLoading ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" }), "Criando conta..."] })) : (_jsxs("div", { className: "flex items-center gap-2", children: ["Criar conta ", _jsx(ArrowRight, { className: "w-4 h-4" })] })) })] })), displayedError ? (_jsx("div", { className: "mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600", children: displayedError })) : null, _jsxs("div", { className: "relative my-6", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-slate-200" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-slate-400", children: "ou continue com" }) })] }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs(Button, { variant: "ghost", className: "h-12 bg-transparent border-0 text-slate-500 hover:bg-[#F3F4F6] focus-visible:ring-0 flex items-center justify-center gap-2", type: "button", onClick: handleGoogle, disabled: isLoading, children: [_jsx("span", { className: "inline-flex h-4 w-4 items-center justify-center", children: _jsx(Sparkles, { className: "h-4 w-4 text-blue-600" }) }), "Google"] }), _jsxs(Button, { variant: "ghost", className: "h-12 bg-transparent border-0 text-slate-500 hover:bg-[#F3F4F6] focus-visible:ring-0 flex items-center justify-center gap-2", type: "button", onClick: handleMicrosoft, disabled: isLoading, children: [_jsxs("span", { className: "inline-grid grid-cols-2 gap-[2px]", children: [_jsx("span", { className: "h-2 w-2 bg-[#F25022]" }), _jsx("span", { className: "h-2 w-2 bg-[#7FBA00]" }), _jsx("span", { className: "h-2 w-2 bg-[#00A4EF]" }), _jsx("span", { className: "h-2 w-2 bg-[#FFB900]" })] }), "Microsoft"] })] })] })] }), _jsx("p", { className: "text-center text-slate-500 text-sm mt-6", children: "\u00A9 2024 G&P Gest\u00E3o de Projetos. Todos os direitos reservados." })] })] }));
};
export default Auth;
