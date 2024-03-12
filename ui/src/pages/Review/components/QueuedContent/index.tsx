import { FC, useEffect, useState } from 'react';
import { Card, Alert, Stack, Button } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import classNames from 'classnames';

import { getPendingReviewPostList, putPendingReviewAction } from '@/services';
import { BaseUserCard, Tag, FormatTime, Icon } from '@/components';
import { scrollToDocTop } from '@/utils';
import type * as Type from '@/common/interface';
import { ADMIN_LIST_STATUS } from '@/common/constants';
import generateData from '../../utils/generateData';

interface IProps {
  refreshCount: () => void;
}

const Index: FC<IProps> = ({ refreshCount }) => {
  const { t } = useTranslation('translation', { keyPrefix: 'page_review' });
  const [noTasks, setNoTasks] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [reviewResp, setReviewResp] = useState<Type.QuestionDetailRes>();
  const flagItemData = reviewResp?.list[0] as Type.QueuedReviewItem;

  console.log('pendingResp', reviewResp);

  const resolveNextOne = (resp, pageNumber) => {
    const { count, list = [] } = resp;
    // auto rollback
    if (!list.length && count && page !== 1) {
      pageNumber = 1;
      setPage(pageNumber);
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      queryNextOne(pageNumber);
      return;
    }
    if (pageNumber !== page) {
      setPage(pageNumber);
    }
    setReviewResp(resp);
    if (!list.length) {
      setNoTasks(true);
    }
    setTimeout(() => {
      scrollToDocTop();
    }, 150);
  };

  const queryNextOne = (pageNumber) => {
    getPendingReviewPostList(pageNumber).then((resp) => {
      resolveNextOne(resp, pageNumber);
    });
  };

  useEffect(() => {
    queryNextOne(page);
  }, []);

  const handleAction = (type: 'approve' | 'reject') => {
    if (!flagItemData) {
      return;
    }
    setIsLoading(true);
    putPendingReviewAction({
      status: type,
      review_id: String(flagItemData?.flag_id),
    })
      .then(() => {
        refreshCount();
        queryNextOne(page + 1);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  const { object_type, author_user_info, object_status, reason } =
    flagItemData || {
      object_type: '',
      author_user_info: null,
      reason: null,
      object_status: 0,
    };

  const { itemLink, itemId, itemTimePrefix } = generateData(flagItemData);

  if (noTasks) return null;
  return (
    <Card>
      <Card.Header>
        {object_type !== 'user' ? t('queued_post') : t('queued_post_user')}
      </Card.Header>
      <Card.Body className="p-0">
        <Alert variant="info" className="border-0 rounded-0 mb-0">
          <Stack
            direction="horizontal"
            gap={1}
            className="align-items-center mb-2">
            <div className="small d-flex align-items-center">
              <Icon type="bi" name="plugin" size="24px" className="me-1" />
              <span>{flagItemData?.submitter_display_name}</span>
            </div>
            {flagItemData?.submit_at && (
              <FormatTime
                time={flagItemData.submit_at}
                className="small text-secondary"
                preFix={t('proposed')}
              />
            )}
          </Stack>
          <Stack className="align-items-start">
            <p className="mb-0">{reason}</p>
          </Stack>
        </Alert>
        <div className="p-3">
          <small className="d-block text-secondary mb-4">
            <span>{t(object_type, { keyPrefix: 'btns' })} </span>
            <Link to={itemLink} target="_blank" className="link-secondary">
              #{itemId}
            </Link>
          </small>
          {object_type === 'question' && (
            <>
              <h5 className="mb-3">{flagItemData?.title}</h5>
              <div className="mb-4">
                {flagItemData?.tags?.map((item) => {
                  return (
                    <Tag key={item.slug_name} className="me-1" data={item} />
                  );
                })}
              </div>
            </>
          )}
          <div className="small font-monospace">
            {flagItemData?.original_text}
          </div>
          <div className="d-flex flex-wrap align-items-center justify-content-between mt-4">
            <div>
              <span
                className={classNames(
                  'badge',
                  ADMIN_LIST_STATUS[object_status]?.variant,
                )}>
                {t(ADMIN_LIST_STATUS[object_status]?.name, {
                  keyPrefix: 'admin.questions',
                })}
              </span>
              {flagItemData?.object_show_status === 2 && (
                <span
                  className={classNames(
                    'ms-1 badge',
                    ADMIN_LIST_STATUS.unlist.variant,
                  )}>
                  {t(ADMIN_LIST_STATUS.unlist.name, { keyPrefix: 'btns' })}
                </span>
              )}
            </div>
            <div className="d-flex align-items-center small">
              <BaseUserCard data={author_user_info} avatarSize="24" />
              <FormatTime
                time={Number(flagItemData?.created_at)}
                className="text-secondary ms-1 flex-shrink-0"
                preFix={t(itemTimePrefix, { keyPrefix: 'question_detail' })}
              />
            </div>
          </div>
        </div>
      </Card.Body>

      <Card.Footer className="p-3">
        <p>
          {object_type !== 'user'
            ? t('approve_post_tip')
            : t('approve_user_tip')}
        </p>
        <Stack direction="horizontal" gap={2}>
          <Button
            variant="outline-primary"
            disabled={isLoading}
            onClick={() => handleAction('approve')}>
            {t('approve', { keyPrefix: 'btns' })}
          </Button>
          <Button
            variant="outline-primary"
            disabled={isLoading}
            onClick={() => handleAction('reject')}>
            {t('reject', { keyPrefix: 'btns' })}
          </Button>
        </Stack>
      </Card.Footer>
    </Card>
  );
};

export default Index;
