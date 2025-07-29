import { sounds } from '@/data/sounds';

import styles from './ambient.module.css';
import { Sounds } from './sounds';

const { categories } = sounds;

export function Categories() {
  return (
    <div className={styles.categories}>
      {categories.map(category => (
        <div className={styles.category} key={category.id}>
          <h2 className={styles.categoryTitle}>{category.title}</h2>
          <Sounds sounds={category.sounds} />
        </div>
      ))}
    </div>
  );
}
