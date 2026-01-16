import { BiTrash } from 'react-icons/bi';
import { LuCopy, LuDownload } from 'react-icons/lu';
import { FaCheck } from 'react-icons/fa6';
import { FaUndo } from 'react-icons/fa';

import { Window } from '@/components/window';
import { useWindowState } from '@/contexts/window-state';

import { useNotepadStore } from './notepad.store';
import { useCopy } from '@/hooks/use-copy';
import { download } from '@/helpers/download';

import styles from './notepad.module.css';

export function Notepad() {
  const { isOpen, onClose } = useWindowState('notepad');
  const note = useNotepadStore(state => state.note);
  const history = useNotepadStore(state => state.history);
  const write = useNotepadStore(state => state.write);
  const words = useNotepadStore(state => state.words());
  const characters = useNotepadStore(state => state.characters());
  const clear = useNotepadStore(state => state.clear);
  const restore = useNotepadStore(state => state.restore);

  const { copy, copying } = useCopy();

  return (
    <Window
      isOpen={isOpen}
      title="Notepad"
      windowName="notepad"
      onClose={onClose}
    >
      <div className={styles.wrapper}>
        <textarea
          className={styles.textarea}
          dir="auto"
          placeholder="What is on your mind?"
          spellCheck={false}
          value={note}
          onChange={e => write(e.target.value)}
        />

        <footer>
          <p>
            {characters} char{characters !== 1 && 's'} • {words} word
            {words !== 1 && 's'}
          </p>

          <div className={styles.buttons}>
            <button onClick={() => copy(note)}>
              {copying ? <FaCheck /> : <LuCopy />}
            </button>
            <button onClick={() => download('Haus Note.txt', note)}>
              <LuDownload />
            </button>
            <button onClick={() => (history ? restore() : clear())}>
              {history ? <FaUndo /> : <BiTrash />}
            </button>
          </div>
        </footer>
      </div>
    </Window>
  );
}
