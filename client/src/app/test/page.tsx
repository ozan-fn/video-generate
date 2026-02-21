import Link from "next/link";

export default function TestPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
                <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
                    <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">Test Page</h1>
                    <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">This is a test page. You can navigate back to the home page using the button below.</p>
                </div>
                <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
                    <Link className="flex h-12 w-full items-center justify-center rounded-full bg-blue-500 px-5 text-white transition-colors hover:bg-blue-600 dark:hover:bg-blue-400 md:w-[158px]" href="/">
                        Back to Home
                    </Link>
                </div>
            </main>
        </div>
    );
}
