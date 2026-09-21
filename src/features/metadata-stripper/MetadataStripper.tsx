"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ArrowDownTrayIcon,
	ArrowUpTrayIcon,
	MapPinIcon,
	ShieldCheckIcon,
	TrashIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import {
	inspectImageMetadata,
	stripImageMetadata,
	type ImageMetadataReport,
	type StripOptions,
} from "@/lib/imageMetadataUtils";
import { formatBytes } from "@/lib/formatUtils";
import { downloadBytes } from "@/lib/downloadUtils";
import styles from "./MetadataStripper.module.scss";

interface LoadedImage {
	id: string;
	name: string;
	type: string;
	bytes: Uint8Array;
	previewUrl: string;
	report: ImageMetadataReport | null;
}

const ACCEPT = "image/jpeg,image/png,image/webp";
const MIME: Record<string, string> = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };

function exifRows(report: ImageMetadataReport): { label: string; value: string }[] {
	const e = report.exif;
	if (!e) return [];
	const rows: { label: string; value: string }[] = [];
	const camera = [e.make, e.model].filter(Boolean).join(" ");
	if (camera) rows.push({ label: "Camera", value: camera });
	if (e.lensModel) rows.push({ label: "Lens", value: e.lensModel });
	if (e.software) rows.push({ label: "Software", value: e.software });
	if (e.dateTimeOriginal) rows.push({ label: "Taken", value: e.dateTimeOriginal });
	if (e.dateTime && e.dateTime !== e.dateTimeOriginal) rows.push({ label: "Modified", value: e.dateTime });
	const exposure = [e.exposureTime, e.fNumber, e.iso ? `ISO ${e.iso}` : "", e.focalLength].filter(Boolean).join(" · ");
	if (exposure) rows.push({ label: "Exposure", value: exposure });
	if (e.orientation && e.orientation !== 1) rows.push({ label: "Orientation", value: `EXIF ${e.orientation}` });
	if (e.artist) rows.push({ label: "Artist", value: e.artist });
	if (e.copyright) rows.push({ label: "Copyright", value: e.copyright });
	return rows;
}

export default function MetadataStripper() {
	const [images, setImages] = useState<LoadedImage[]>([]);
	const [options, setOptions] = useState<Required<StripOptions>>({ exif: true, icc: false, comments: true });
	const [isDragging, setIsDragging] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const addFiles = useCallback(async (files: FileList | File[]) => {
		const list = Array.from(files).filter((f) => /^image\/(jpeg|png|webp)$/.test(f.type) || /\.(jpe?g|png|webp)$/i.test(f.name));
		if (!list.length) {
			setError("Only JPEG, PNG and WebP files are supported.");
			return;
		}
		setError(null);
		const loaded = await Promise.all(
			list.map(async (file): Promise<LoadedImage> => {
				const bytes = new Uint8Array(await file.arrayBuffer());
				return {
					id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
					name: file.name,
					type: file.type,
					bytes,
					previewUrl: URL.createObjectURL(file),
					report: inspectImageMetadata(bytes),
				};
			})
		);
		setImages((prev) => [...prev, ...loaded]);
	}, []);

	// Paste from clipboard anywhere on the page
	useEffect(() => {
		const onPaste = (e: ClipboardEvent) => {
			const files = Array.from(e.clipboardData?.files ?? []);
			if (files.length) {
				e.preventDefault();
				void addFiles(files);
			}
		};
		document.addEventListener("paste", onPaste);
		return () => document.removeEventListener("paste", onPaste);
	}, [addFiles]);

	// Release object URLs on unmount
	useEffect(() => {
		return () => images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const stripped = useMemo(
		() =>
			images.map((img) => {
				try {
					return { id: img.id, bytes: stripImageMetadata(img.bytes, options) };
				} catch {
					return { id: img.id, bytes: null };
				}
			}),
		[images, options]
	);

	const strippedFor = (id: string) => stripped.find((s) => s.id === id)?.bytes ?? null;

	const removeImage = (id: string) => {
		setImages((prev) => {
			const target = prev.find((i) => i.id === id);
			if (target) URL.revokeObjectURL(target.previewUrl);
			return prev.filter((i) => i.id !== id);
		});
	};

	const clearAll = () => {
		images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
		setImages([]);
	};

	const download = (img: LoadedImage) => {
		const bytes = strippedFor(img.id);
		if (!bytes || !img.report) return;
		downloadBytes(img.name.replace(/(\.[^.]+)?$/, "-clean$1"), bytes, MIME[img.report.format]);
	};

	const downloadAll = () => images.forEach((img) => download(img));

	const totalBefore = images.reduce((n, i) => n + i.bytes.length, 0);
	const totalAfter = stripped.reduce((n, s) => n + (s.bytes?.length ?? 0), 0);

	return (
		<div className={styles.container}>
			{/* Drop zone */}
			<label
				className={`${styles.dropZone} ${isDragging ? styles.dragging : ""}`}
				onDragOver={(e) => {
					e.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={(e) => {
					e.preventDefault();
					setIsDragging(false);
					void addFiles(e.dataTransfer.files);
				}}
			>
				<input
					ref={inputRef}
					type="file"
					accept={ACCEPT}
					multiple
					className="sr-only"
					aria-label="Choose images to strip metadata from"
					onChange={(e) => {
						if (e.target.files) void addFiles(e.target.files);
						e.target.value = "";
					}}
				/>
				<ArrowUpTrayIcon className={styles.dropIcon} />
				<span className={styles.dropTitle}>Drop images here</span>
				<span className={styles.dropHint}>or click to select, or paste from the clipboard. JPEG, PNG and WebP.</span>
			</label>
			{error && <p className={styles.error}>{error}</p>}

			{/* Options */}
			<div className={`flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 p-4 ${styles.optionsBar}`}>
				<span className={styles.optionsTitle}>Remove</span>
				<label className={styles.checkboxLabel}>
					<input type="checkbox" checked={options.exif} onChange={(e) => setOptions({ ...options, exif: e.target.checked })} />
					EXIF, GPS &amp; XMP
				</label>
				<label className={styles.checkboxLabel}>
					<input type="checkbox" checked={options.comments} onChange={(e) => setOptions({ ...options, comments: e.target.checked })} />
					Comments &amp; text chunks
				</label>
				<label className={styles.checkboxLabel} title="Colour profiles affect how the image renders. Leave this off unless you know you do not need it.">
					<input type="checkbox" checked={options.icc} onChange={(e) => setOptions({ ...options, icc: e.target.checked })} />
					ICC colour profile
				</label>
			</div>

			{/* Results */}
			{images.length > 0 && (
				<div className="flex justify-between items-center flex-wrap gap-3 mt-6 mb-3">
					<p className={`m-0 text-sm ${styles.summary}`}>
						{images.length} file{images.length === 1 ? "" : "s"} · {formatBytes(totalBefore)} → {formatBytes(totalAfter)}
					</p>
					<div className="flex gap-2">
						{images.length > 1 && (
							<button type="button" className={styles.btnPrimary} onClick={downloadAll}>
								<ArrowDownTrayIcon className="w-4 h-4" />
								Download all
							</button>
						)}
						<button type="button" className={styles.btnSecondary} onClick={clearAll}>
							<TrashIcon className="w-4 h-4" />
							Clear
						</button>
					</div>
				</div>
			)}

			<div className="flex flex-col gap-4">
				{images.map((img) => {
					const bytes = strippedFor(img.id);
					const report = img.report;
					const rows = report ? exifRows(report) : [];
					const removable = report?.segments.filter((s) =>
						s.kind === "icc" ? options.icc : s.kind === "comment" ? options.comments : s.kind === "other" ? false : options.exif
					) ?? [];
					const kept = report?.segments.filter((s) => !removable.includes(s)) ?? [];
					return (
						<div key={img.id} className={styles.card}>
							<div className={styles.cardMain}>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img src={img.previewUrl} alt="" className={styles.thumb} />
								<div className="min-w-0 flex-1">
									<div className="flex justify-between items-start gap-3">
										<div className="min-w-0">
											<p className={`m-0 font-semibold truncate ${styles.fileName}`}>{img.name}</p>
											<p className={`m-0 text-xs ${styles.fileMeta}`}>
												{report ? report.format.toUpperCase() : "Unsupported"} · {formatBytes(img.bytes.length)}
												{bytes && bytes.length !== img.bytes.length && <> → {formatBytes(bytes.length)}</>}
											</p>
										</div>
										<button type="button" className={styles.iconBtn} onClick={() => removeImage(img.id)} aria-label={`Remove ${img.name}`}>
											<XMarkIcon className="w-4 h-4" />
										</button>
									</div>

									{!report && <p className={styles.error}>Could not read this file as JPEG, PNG or WebP.</p>}

									{report && report.segments.length === 0 && (
										<p className={`flex items-center gap-2 mt-3 mb-0 text-sm ${styles.clean}`}>
											<ShieldCheckIcon className="w-4 h-4" />
											No metadata found. This file is already clean.
										</p>
									)}

									{report && report.segments.length > 0 && (
										<div className="mt-3 flex flex-col gap-3">
											<div className="flex flex-wrap gap-1.5">
												{removable.map((s, i) => (
													<span key={`r${i}`} className={`${styles.tag} ${styles.tagRemove}`} title="Will be removed">
														{s.name} · {formatBytes(s.size)}
													</span>
												))}
												{kept.map((s, i) => (
													<span key={`k${i}`} className={`${styles.tag} ${styles.tagKeep}`} title="Will be kept">
														{s.name} · {formatBytes(s.size)}
													</span>
												))}
											</div>

											{(rows.length > 0 || report.exif?.gps) && (
												<dl className={styles.exifGrid}>
													{rows.map((r) => (
														<div key={r.label} className={styles.exifRow}>
															<dt>{r.label}</dt>
															<dd>{r.value}</dd>
														</div>
													))}
													{report.exif?.gps && (
														<div className={`${styles.exifRow} ${styles.gpsRow}`}>
															<dt>
																<MapPinIcon className="w-4 h-4 inline -mt-0.5 mr-1" />
																GPS
															</dt>
															<dd>
																{report.exif.gps.latitude.toFixed(5)}, {report.exif.gps.longitude.toFixed(5)}
																{report.exif.gps.altitude !== undefined && <> · {Math.round(report.exif.gps.altitude)} m</>}
																{" "}
																<a
																	href={`https://www.openstreetmap.org/?mlat=${report.exif.gps.latitude}&mlon=${report.exif.gps.longitude}#map=14/${report.exif.gps.latitude}/${report.exif.gps.longitude}`}
																	target="_blank"
																	rel="noopener noreferrer"
																	className={styles.mapLink}
																>
																	View on map
																</a>
															</dd>
														</div>
													)}
												</dl>
											)}
										</div>
									)}
								</div>
							</div>
							{report && (
								<div className={styles.cardActions}>
									<button type="button" className={styles.btnPrimary} onClick={() => download(img)} disabled={!bytes}>
										<ArrowDownTrayIcon className="w-4 h-4" />
										Download clean copy
									</button>
								</div>
							)}
						</div>
					);
				})}
			</div>

			{/* Info */}
			<div className={`mt-6 ${styles.glassCard}`}>
				<h3 className={`text-lg font-semibold mb-3 m-0 ${styles.cardTitle}`}>How it works</h3>
				<ul className={styles.infoList}>
					<li>
						Files never leave your browser. The tool walks the container structure and drops the metadata
						segments, so the pixel data is copied byte for byte with no re-encoding or quality loss.
					</li>
					<li>
						<strong>EXIF</strong> carries camera, lens, exposure, timestamps and often the GPS position where a
						photo was taken. <strong>XMP</strong> and <strong>IPTC</strong> carry editing history, keywords and
						author details.
					</li>
					<li>
						<strong>ICC profiles</strong> describe colour and are kept by default. Removing one can shift colours
						on wide-gamut displays, so only strip it when the file size matters more than colour accuracy.
					</li>
					<li>
						Stripping the EXIF orientation flag means a photo shot sideways will download unrotated. Rotate it
						first with the image resizer if that matters.
					</li>
				</ul>
			</div>
		</div>
	);
}
