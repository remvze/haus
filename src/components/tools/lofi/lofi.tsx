import YouTube from "react-youtube";

import { Window } from "@/components/window";
import { useWindowState } from "@/contexts/window-state";
import { padNumber } from "@/helpers/number";

import styles from "./lofi.module.css";
import { videos } from "./videos";

export function LofiContent() {
	return (
		<div className={styles.videos}>
			{videos.map((video, index) => (
				<div className={styles.video} key={video.id}>
					<header>
						<span className={styles.index}>{padNumber(index + 1, 2)}</span>
						<strong>{video.channel}</strong>
						<span className={styles.slash}>/</span>
						<span className={styles.title}>{video.title}</span>
					</header>
					<div className={styles.container}>
						<YouTube iframeClassName={styles.iframe} videoId={video.id} />
					</div>
				</div>
			))}
		</div>
	);
}

export function Lofi() {
	const { isOpen, isMinimized, onClose, onMinimize } = useWindowState("lofi");

	return (
		<Window
			contained
			containerWidth={600}
			isOpen={isOpen && !isMinimized}
			persist={isMinimized}
			title="Lofi Music"
			windowName="lofi-music"
			onClose={onClose}
			onMinimize={onMinimize}
		>
			<div className={styles.wrapper}>
				<LofiContent />
			</div>
		</Window>
	);
}
