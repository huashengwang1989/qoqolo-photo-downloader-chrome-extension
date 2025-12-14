The content for the model content is as the following:

```html
<div class="view-foliette-modal-body top-sm">
  <p>
    {content_for_paragraph_1}<br />
    <br />
    {content_for_paragraph_2}<br />
    <br />
    {content_for_paragraph_n}
  </p>

  <p class="top-lg">
    <span class="text-muted">by <a href="#">{teacher_name}</a></span>
    <span class="text-muted">on {publish_date: e.g. 25 Aug 2025}</span>
  </p>

  <hr />

  <p class="top-lg"></p>
  <h5>Learning Area</h5>
  <ul>
    <li>{learning_area_1}</li>
    <li>{learning_area_2}</li>
    <li>{learning_area_3}</li>
  </ul>
  <p></p>

  <p class="top-lg"></p>
  <h5>Stickers</h5>
  <ul class="list-inline sticker-list">
    <li>
      <img
        src="/rs/sticker/{sticker_filename}.png"
        class="foliette-sticker"
        title="P"
        width="44px"
      />
    </li>
    <li>
      <img
        src="/rs/sticker/{sticker_filename}.png"
        class="foliette-sticker"
        title="P"
        width="44px"
      />
    </li>
  </ul>
  <p></p>
</div>
```
