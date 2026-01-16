import { SnackbarProvider } from "@/contexts/snackbar";
import { WindowStateProvider } from "@/contexts/window-state";
import { WindowsProvider } from "@/contexts/windows";
import { Settings } from "../settings";
import { StoreConsumer } from "../store-consumer";
import { Toolbox } from "../toolbox";
import { Ambient } from "../tools/ambient/ambient";
import { Breathing } from "../tools/breathing";
import { Lofi } from "../tools/lofi";
import { Notepad } from "../tools/notepad";
import { Pomodoro } from "../tools/pomodoro";
import { Timers } from "../tools/timers";
import { Todo } from "../tools/todo";

import styles from "./app.module.css";

export function App() {
	return (
		<StoreConsumer>
			<SnackbarProvider>
				<WindowStateProvider>
					<WindowsProvider>
						<div className={styles.app}>
							<Toolbox />

							<Notepad />

							<Todo />

							<Pomodoro />

							<Breathing />

							<Ambient />

							<Timers />

							<Lofi />

							<Settings />
						</div>
					</WindowsProvider>
				</WindowStateProvider>
			</SnackbarProvider>
		</StoreConsumer>
	);
}
