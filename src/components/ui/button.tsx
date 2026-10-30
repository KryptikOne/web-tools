import clsx from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	children: React.ReactNode;
}

export function Button({ children, className, ...rest }: ButtonProps) {
	return (
		<button {...rest} className={clsx("flex h-auto items-center px-4 py-2 text-md font-bold transition-colors focus-visible:outline focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:opacity-50", className)}>
			{children}
		</button>
	);
}
