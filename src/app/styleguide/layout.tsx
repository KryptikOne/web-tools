import AppLayout from "@/components/AppLayout/AppLayout";

export default function StyleguideLayout({ children }: Readonly<{ children: React.ReactNode }>) {
	return <AppLayout>{children}</AppLayout>;
}
