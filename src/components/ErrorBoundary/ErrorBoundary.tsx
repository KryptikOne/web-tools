"use client";

import { Component, ReactNode } from "react";
import { ExclamationTriangleIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import styles from "./ErrorBoundary.module.scss";

interface ErrorBoundaryProps {
	children: ReactNode;
}

interface ErrorBoundaryState {
	hasError: boolean;
	error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor(props: ErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { hasError: true, error };
	}

	handleReset = () => {
		this.setState({ hasError: false, error: null });
	};

	render() {
		if (this.state.hasError) {
			return (
				<div className={styles.container}>
					<div className={styles.card}>
						<div className={styles.iconWrapper}>
							<ExclamationTriangleIcon className="w-10 h-10" />
						</div>
						<h2 className={styles.title}>Something went wrong</h2>
						<p className={styles.message}>
							This tool encountered an unexpected error. You can try reloading it below.
						</p>
						{this.state.error && (
							<details className={styles.details}>
								<summary className="cursor-pointer text-sm font-medium">
									Error details
								</summary>
								<pre className={styles.errorText}>
									{this.state.error.message}
								</pre>
							</details>
						)}
						<button onClick={this.handleReset} className={styles.resetBtn}>
							<ArrowPathIcon className="w-4 h-4" />
							Try Again
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
