import { SignIn } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <section className="w-screen h-screen flex justify-center items-center">
            <SignIn />
        </section>
    );
}
