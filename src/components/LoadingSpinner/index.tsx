import { Spin } from 'antd';
import styles from './index.module.scss';

export default function LoadingSpinner() {
  return (
    <div className={styles.wrap}>
      <Spin size="large" />
    </div>
  );
}
