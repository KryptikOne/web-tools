"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	CameraIcon,
	StopIcon,
	VideoCameraIcon,
	ArrowPathIcon,
	ArrowDownTrayIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import styles from "./CameraRecorder.module.scss";

type CaptureStatus =
	| { kind: "idle" }
	| { kind: "starting" }
	| { kind: "ready" }
	| { kind: "denied"; message: string }
	| { kind: "unsupported"; message: string };

type Recording = {
	url: string;
	mimeType: string;
	extension: string;
	createdAt: number;
};

type Photo = {
	url: string;
	createdAt: number;
};

function pickRecorderMime(): { mimeType: string; extension: string } | null {
	if (typeof MediaRecorder === "undefined") return null;
	const candidates: { mimeType: string; extension: string }[] = [
		{ mimeType: "video/webm;codecs=vp9,opus", extension: "webm" },
		{ mimeType: "video/webm;codecs=vp8,opus", extension: "webm" },
		{ mimeType: "video/webm", extension: "webm" },
		{ mimeType: "video/mp4", extension: "mp4" },
	];
	for (const c of candidates) {
		if (MediaRecorder.isTypeSupported(c.mimeType)) return c;
	}
	return null;
}

function downloadBlobUrl(url: string, filename: string) {
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
}

export default function CameraRecorder() {
	const [status, setStatus] = useState<CaptureStatus>({ kind: "idle" });
	const [isRecording, setIsRecording] = useState(false);
	const [recordingSeconds, setRecordingSeconds] = useState(0);
	const [photo, setPhoto] = useState<Photo | null>(null);
	const [recording, setRecording] = useState<Recording | null>(null);

	const videoRef = useRef<HTMLVideoElement | null>(null);
	const streamRef = useRef<MediaStream | null>(null);
	const recorderRef = useRef<MediaRecorder | null>(null);
	const chunksRef = useRef<BlobPart[]>([]);
	const recorderMimeRef = useRef<{ mimeType: string; extension: string } | null>(
		null
	);
	const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null
	);

	const recorderMime = useMemo(() => pickRecorderMime(), []);
	const recordingSupported = recorderMime !== null;

	const stopTracks = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
	}, []);

	const startCamera = useCallback(async () => {
		if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
			setStatus({
				kind: "unsupported",
				message:
					"This browser does not support camera access (getUserMedia).",
			});
			return;
		}
		setStatus({ kind: "starting" });
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				video: true,
				audio: true,
			});
			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				await videoRef.current.play().catch(() => {});
			}
			setStatus({ kind: "ready" });
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Could not access the camera.";
			setStatus({ kind: "denied", message });
		}
	}, []);

	const stopCamera = useCallback(() => {
		if (recorderRef.current && isRecording) {
			recorderRef.current.stop();
		}
		stopTracks();
		setStatus({ kind: "idle" });
		setIsRecording(false);
		setRecordingSeconds(0);
	}, [isRecording, stopTracks]);

	const handleTakePhoto = useCallback(() => {
		const video = videoRef.current;
		if (!video || !streamRef.current) return;
		const w = video.videoWidth;
		const h = video.videoHeight;
		if (!w || !h) return;

		const canvas = document.createElement("canvas");
		canvas.width = w;
		canvas.height = h;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		ctx.drawImage(video, 0, 0, w, h);

		canvas.toBlob((blob) => {
			if (!blob) return;
			const url = URL.createObjectURL(blob);
			setPhoto((prev) => {
				if (prev) URL.revokeObjectURL(prev.url);
				return { url, createdAt: Date.now() };
			});
		}, "image/png");
	}, []);

	const handleStartRecording = useCallback(() => {
		const stream = streamRef.current;
		if (!stream || !recorderMime) return;

		try {
			const recorder = new MediaRecorder(stream, {
				mimeType: recorderMime.mimeType,
			});
			recorderRef.current = recorder;
			recorderMimeRef.current = recorderMime;
			chunksRef.current = [];

			recorder.ondataavailable = (e: BlobEvent) => {
				if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
			};
			recorder.onstop = () => {
				const mime = recorderMimeRef.current;
				const blob = new Blob(chunksRef.current, {
					type: mime?.mimeType ?? "video/webm",
				});
				chunksRef.current = [];
				const url = URL.createObjectURL(blob);
				setRecording((prev) => {
					if (prev) URL.revokeObjectURL(prev.url);
					return {
						url,
						mimeType: mime?.mimeType ?? "video/webm",
						extension: mime?.extension ?? "webm",
						createdAt: Date.now(),
					};
				});
			};

			recorder.start();
			setIsRecording(true);
			setRecordingSeconds(0);
			const startedAt = performance.now();
			recordingIntervalRef.current = setInterval(() => {
				setRecordingSeconds(Math.floor((performance.now() - startedAt) / 1000));
			}, 250);
		} catch (err) {
			const message =
				err instanceof Error
					? err.message
					: "Could not start recording.";
			setStatus({ kind: "denied", message });
		}
	}, [recorderMime]);

	const handleStopRecording = useCallback(() => {
		const recorder = recorderRef.current;
		if (recorder && recorder.state !== "inactive") {
			recorder.stop();
		}
		if (recordingIntervalRef.current) {
			clearInterval(recordingIntervalRef.current);
			recordingIntervalRef.current = null;
		}
		setIsRecording(false);
	}, []);

	const clearPhoto = useCallback(() => {
		setPhoto((prev) => {
			if (prev) URL.revokeObjectURL(prev.url);
			return null;
		});
	}, []);

	const clearRecording = useCallback(() => {
		setRecording((prev) => {
			if (prev) URL.revokeObjectURL(prev.url);
			return null;
		});
	}, []);

	useEffect(() => {
		return () => {
			if (recordingIntervalRef.current) {
				clearInterval(recordingIntervalRef.current);
			}
			if (recorderRef.current && recorderRef.current.state !== "inactive") {
				try {
					recorderRef.current.stop();
				} catch {
					// ignore
				}
			}
			stopTracks();
			setPhoto((prev) => {
				if (prev) URL.revokeObjectURL(prev.url);
				return null;
			});
			setRecording((prev) => {
				if (prev) URL.revokeObjectURL(prev.url);
				return null;
			});
		};
	}, [stopTracks]);

	const ready = status.kind === "ready";

	return (
		<div className={styles.container}>
			<div className={`${styles.glassCard} ${styles.privacyBanner}`}>
				<p className={`text-sm m-0 ${styles.privacyText}`}>
					Nothing leaves your device — all capture and encoding happens
					locally in your browser.
				</p>
			</div>

			<div className={`mt-4 ${styles.glassCard}`}>
				<div className={styles.previewWrap}>
					<video
						ref={videoRef}
						className={styles.preview}
						autoPlay
						playsInline
						muted
						aria-label="Camera preview"
					/>
					{!ready && (
						<div className={styles.previewOverlay}>
							{status.kind === "idle" && (
								<p className={styles.overlayText}>
									Camera preview will appear here.
								</p>
							)}
							{status.kind === "starting" && (
								<p className={styles.overlayText}>Requesting camera…</p>
							)}
							{status.kind === "denied" && (
								<p className={styles.overlayError}>
									{status.message ||
										"Camera access denied. Check your browser permissions."}
								</p>
							)}
							{status.kind === "unsupported" && (
								<p className={styles.overlayError}>{status.message}</p>
							)}
						</div>
					)}
					{isRecording && (
						<div className={styles.recBadge}>
							<span className={styles.recDot} />
							REC {recordingSeconds}s
						</div>
					)}
				</div>

				<div className={styles.controls}>
					{!ready ? (
						<button
							onClick={startCamera}
							className={`${styles.btnAction} ${styles.btnPrimary}`}
							disabled={status.kind === "starting"}
						>
							<VideoCameraIcon className="w-5 h-5" />
							{status.kind === "starting" ? "Starting…" : "Start camera"}
						</button>
					) : (
						<>
							<button
								onClick={handleTakePhoto}
								className={styles.btnAction}
								disabled={isRecording}
							>
								<CameraIcon className="w-5 h-5" />
								Take photo
							</button>
							{!isRecording ? (
								<button
									onClick={handleStartRecording}
									className={styles.btnAction}
									disabled={!recordingSupported}
									title={
										recordingSupported
											? undefined
											: "MediaRecorder is not supported in this browser."
									}
								>
									<VideoCameraIcon className="w-5 h-5" />
									Start recording
								</button>
							) : (
								<button
									onClick={handleStopRecording}
									className={`${styles.btnAction} ${styles.btnStop}`}
								>
									<StopIcon className="w-5 h-5" />
									Stop recording
								</button>
							)}
							<button onClick={stopCamera} className={styles.btnAction}>
								<ArrowPathIcon className="w-5 h-5" />
								Stop camera
							</button>
						</>
					)}
				</div>
				{!recordingSupported && ready && (
					<p className={`text-xs mt-3 m-0 ${styles.cardSubtitle}`}>
						Video recording is not supported in this browser.
					</p>
				)}
			</div>

			<div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mt-4`}>
				<div className={styles.glassCard}>
					<div className="flex justify-between items-center mb-3 flex-wrap gap-2">
						<h3 className={`text-base font-semibold m-0 ${styles.cardTitle}`}>
							Last photo
						</h3>
						{photo && (
							<div className="flex gap-2">
								<button
									onClick={() =>
										downloadBlobUrl(
											photo.url,
											`photo-${photo.createdAt}.png`
										)
									}
									className={styles.btnAction}
								>
									<ArrowDownTrayIcon className="w-4 h-4" />
									Download
								</button>
								<button
									onClick={clearPhoto}
									className={styles.btnAction}
									aria-label="Discard photo"
								>
									<XMarkIcon className="w-4 h-4" />
								</button>
							</div>
						)}
					</div>
					{photo ? (
						<img
							src={photo.url}
							alt="Captured photo"
							className={styles.mediaPreview}
						/>
					) : (
						<p className={`text-sm m-0 ${styles.cardSubtitle}`}>
							Take a photo to see it here.
						</p>
					)}
				</div>

				<div className={styles.glassCard}>
					<div className="flex justify-between items-center mb-3 flex-wrap gap-2">
						<h3 className={`text-base font-semibold m-0 ${styles.cardTitle}`}>
							Last recording
						</h3>
						{recording && (
							<div className="flex gap-2">
								<button
									onClick={() =>
										downloadBlobUrl(
											recording.url,
											`recording-${recording.createdAt}.${recording.extension}`
										)
									}
									className={styles.btnAction}
								>
									<ArrowDownTrayIcon className="w-4 h-4" />
									Download
								</button>
								<button
									onClick={clearRecording}
									className={styles.btnAction}
									aria-label="Discard recording"
								>
									<XMarkIcon className="w-4 h-4" />
								</button>
							</div>
						)}
					</div>
					{recording ? (
						<video
							src={recording.url}
							controls
							className={styles.mediaPreview}
						/>
					) : (
						<p className={`text-sm m-0 ${styles.cardSubtitle}`}>
							Record a clip to see it here.
						</p>
					)}
				</div>
			</div>

			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>
					How this works
				</h3>
				<p className={`text-sm leading-relaxed m-0 ${styles.infoText}`}>
					The browser&apos;s <code>getUserMedia</code> API streams your
					camera and microphone directly into a <code>&lt;video&gt;</code>{" "}
					element. Photos are drawn to a <code>&lt;canvas&gt;</code> and
					exported as PNG. Recordings use <code>MediaRecorder</code> with
					the best available WebM/MP4 codec. The stream is released when
					you stop the camera or leave the page.
				</p>
			</div>
		</div>
	);
}
