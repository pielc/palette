<script>
  import { onMount } from "svelte";
  import {
    loadImageAndLabels,
    loadPalette,
    loadTestPalette,
  } from "$lib/supabase";
  import { initWebGL, renderScene } from "$lib/webgl";
  import "@fontsource/dekko";

  let canvas;
  let canvasHeight = 500;
  let selectedLabel = null;
  let selectedColor = null;
  let loading = true;
  let error = null;

  let labelColors = {};
  let artInfo = {};

  let proportionalPalette = false;

  const MINIMAL_PALETTE_RECTANGLE_SIZE = 0.05;

  let glContext;

  function toggleProprotionalPalette() {
    proportionalPalette = !proportionalPalette;
  }

  async function loadData() {
    try {
      let palette = await loadPalette();

      if (!palette) {
        palette = await loadTestPalette();
      }

      if (!palette) {
        throw new Error("Error fetching the palette");
      }

      const { image, labels, width, height } = await loadImageAndLabels(
        palette.imageId,
      );

      labelColors = palette.labelColors;
      artInfo = palette.artInfo;

      console.log(labelColors);
      labelColors.sort((a, b) => a.sortedIndex < b.sortedIndex);

      canvas.width = width;
      canvas.height = height;

      glContext = initWebGL(canvas, image, labels, width, height);
      render();
      loading = false;
    } catch (err) {
      error = err.message;
      console.error(err);
      loading = false;
    }
  }

  function render() {
    if (!glContext) return;
    renderScene(glContext, selectedLabel);
  }

  function selectLabel(labelColor) {
    selectedLabel = selectedLabel === labelColor.id ? null : labelColor.id;
    selectedColor = selectedLabel !== null ? labelColor : null;
    render();
  }

  // TODO: handle no data
  onMount(() => {
    loadData();
  });
</script>

<!-- TODO: add mobile support -->
<div class="dotted-background font-dekko">
  <!-- TODO: add dark theme -->
  <img class="top-right-image" alt="light" src="sun.svg" />
  <div class="layout">
    <h1>Palette</h1>

    {#if loading}
      <div class="hourglass-container">
        <img class="hourglass" src="hourglass.svg" alt="...coming" />
      </div>
    {:else if error}
      <p class="error">{error}</p>
    {/if}

    <div class="content-container" style:display={loading ? "none" : ""}>
      <canvas bind:this={canvas} bind:clientHeight={canvasHeight}></canvas>

      <div class="labels" style="height: {canvasHeight}px; max-height: 70vh;">
        <button on:click={toggleProprotionalPalette}>
          <img
            alt="selection-choice"
            width="80px"
            src={proportionalPalette
              ? "equivalent-select.svg"
              : "proportional-select.svg"}
          />
        </button>
        <div class="colors-column">
          {#each labelColors as labelColor}
            <button
              class="color-square"
              class:active={selectedLabel === labelColor.id}
              style="background: {labelColor.color}; flex: {proportionalPalette
                ? labelColor.size > MINIMAL_PALETTE_RECTANGLE_SIZE
                  ? labelColor.size
                  : MINIMAL_PALETTE_RECTANGLE_SIZE
                : 1}"
              on:click={() => selectLabel(labelColor)}
            >
              <img
                class="arrow-indicator"
                class:selected={selectedLabel === labelColor.id}
                src="arrow.svg"
                alt="selected"
              />
            </button>
          {/each}
        </div>
      </div>
    </div>
    <div class="info-panel" style:display={loading ? "none" : ""}>
      <div class="flex-1 art-info">
        <div class="font-bold">{artInfo.title}</div>
        <div>{artInfo.date}</div>
        <div>{artInfo.artist}</div>
      </div>
      <div class="flex-1 color-info">
        {#if selectedColor}
          <div
            class="color-swatch"
            style="background: {selectedColor.color}"
          ></div>
          <div class="color-details">
            <div class="color-hex-placeholder">{selectedColor.color}</div>
            <div class="color-name-placeholder">{selectedColor.name}</div>
          </div>
        {:else}
          <div></div>
        {/if}
      </div>
    </div>
  </div>
  <div class="footer-caption">"I prefer living in color." - David Hockney</div>
</div>

<!-- TODO: clean style -->

<style>
  @reference "tailwindcss";

  .dotted-background {
    font-family: "Dekko", cursive;
    background-image: radial-gradient(circle, #777 1px, transparent 1px);
    background-size: 15px 15px;
  }

  .footer-caption {
    position: absolute;
    bottom: 0px;
    width: 100%;
    font-style: italic;
    text-align: center;
  }
  .top-right-image {
    position: absolute;
    top: 0px;
    right: 0px;
    width: 90px;
    height: 90px;
  }

  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
  }

  h1 {
    font-size: 45px;
    color: #444;
    text-align: center;
  }

  .content-container {
    display: flex;
    gap: 2rem;
    align-items: flex-start;
    width: 100%;
    min-width: 0;
    max-width: 1500px;
    justify-content: center;
    padding-left: 5vh;
    padding-right: 5vh;
  }

  canvas {
    min-width: 0;
    width: 100%;
    background-color: #000;
  }

  .labels {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 80px;
    flex-shrink: 0;
    height: fit-content;
    margin-right: 2.5rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }

  .colors-column {
    display: flex;
    flex-direction: column;
    gap: 1px;
    height: 100%;
    max-height: 70vh;
  }

  .color-square {
    @apply relative cursor-pointer transition-all duration-200;
  }

  .color-square:hover .arrow-indicator {
    @apply opacity-100;
  }

  .arrow-indicator {
    @apply absolute -right-13 top-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-200;
    height: 30px;
  }

  .arrow-indicator.selected {
    @apply opacity-100;
  }

  .info-panel {
    display: flex;
    width: 100%;
    max-width: 900px;
    min-width: 0;
    gap: 1rem;
  }

  .art-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }

  .color-info {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    min-width: 0;
    flex-shrink: 1;
  }

  .color-swatch {
    aspect-ratio: 1;
    align-self: stretch;
    flex-shrink: 0;
  }

  .color-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    overflow-wrap: break-word;
    word-break: break-all;
  }

  .color-hex-placeholder {
    color: #333;
    font-size: 1.2rem;
    font-weight: bold;
  }

  .color-name-placeholder {
    color: #333;
    font-size: 1.2rem;
    /* font-style: italic; */
  }

  .hourglass {
    height: 90px;
    animation: rotation 2s ease-in-out infinite;
  }

  .hourglass-container {
    height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .error {
    color: #c33;
    text-align: center;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0deg);
    }
    50% {
      transform: rotate(180deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
