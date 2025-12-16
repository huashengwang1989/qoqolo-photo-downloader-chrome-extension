import React from 'react';

import type { Item } from '@/shared/types/item';

interface ItemContentProps {
  item: Item;
  // For future use
  index: number;
  totalItems: number;
}

export const ItemContent: React.FC<ItemContentProps> = ({ item }) => {
  const details = item.details;

  return (
    <>
      <div className="item-section">
        <strong>Title:</strong> {item.title || 'Untitled'}
      </div>
      <div className="item-section">
        <strong>Link:</strong>{' '}
        <a href={item.link} target="_blank" rel="noopener noreferrer" className="item-link">
          {item.link}
        </a>
      </div>
      {details && (
        <>
          {details.images.length > 0 && (
            <div className="item-section">
              <strong>Images:</strong>
              <ul className="item-list">
                {details.images.map((image, imgIndex) => (
                  <li key={imgIndex}>
                    {image.caption || 'No caption'} -{' '}
                    <a href={image.url} target="_blank" rel="noopener noreferrer">
                      {image.url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {details.content && (
            <div className="item-section">
              <p>
                <strong>Content:</strong>
              </p>
              <p className="item-content">{details.content}</p>
            </div>
          )}
          {details.learningArea && details.learningArea.length > 0 && (
            <div className="item-section">
              <strong>Learning Area:</strong>
              <ul className="item-list">
                {details.learningArea.map((area, areaIndex) => (
                  <li key={areaIndex}>{area}</li>
                ))}
              </ul>
            </div>
          )}
          {details.teacher && (
            <div className="item-section">
              <strong>Teacher:</strong> {details.teacher}
            </div>
          )}
          {details.publishDate && (
            <div className="item-section">
              <strong>Publish Date:</strong> {details.publishDate}
            </div>
          )}
          {details.publishDatetime && (
            <div className="item-section">
              <strong>Publish Datetime:</strong> {details.publishDatetime}
            </div>
          )}
          {details.stickers && details.stickers.length > 0 && (
            <div className="item-section">
              <strong>Stickers:</strong> {details.stickers.join(', ')}
            </div>
          )}
        </>
      )}
    </>
  );
};
