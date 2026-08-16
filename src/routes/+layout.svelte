<script lang="ts">
	import '../app.css';

	let { children } = $props();

	const year = new Date().getFullYear();
</script>

<a class="skip-link" href="#main">Skip to content</a>

<header id="site-header">
	<div class="wrap bar">
		<a href="https://lawsuit.gg" class="brand">
			<img class="brand-mark" src="/logo.svg" alt="" aria-hidden="true" />
			<span>MC: Consequences Edition</span>
		</a>
		<nav aria-label="Main">
			<a href="https://lawsuit.gg">Back to lawsuit.gg</a>
		</nav>
	</div>
</header>

<main id="main">
	{@render children()}
</main>

<footer>
	<div class="wrap">
		<p>
			Not affiliated with Microsoft or Mojang AB. Minecraft is the trademark of Microsoft
			Corporation.
		</p>
		<p>
			This site publishes information about ongoing legal proceedings, and is not legal
			advice. Financial information on this site is meant to help the community view our
			finances, but should not be relied on being always accurate.
		</p>
		<p class="copyright">
			© 2024–{year}, Samuel Somerkivi (Perny) &amp; Kian Bröse, MC: Consequences Edition,
			contact@lawsuit.gg
		</p>
	</div>
</footer>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 100;
		background-color: var(--grey-6);
		border-bottom: 2px solid var(--off-black);
		box-shadow: inset 0 2px 0 0 var(--grey-5);
	}

	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem 2rem;
		padding-block: 0.7rem;
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.6rem;
		font-family: var(--pixel);
		color: var(--text);
		text-decoration: none;
		font-size: 1rem;
		letter-spacing: 0.03em;
		white-space: nowrap;
		text-shadow: 2px 2px 0 var(--text-shadow-white);
	}

	.brand:hover {
		color: var(--green-2);
	}

	.brand-mark {
		height: 1.3rem;
		width: auto;
		aspect-ratio: 407 / 470;
		flex-shrink: 0;
	}

	nav a {
		display: inline-flex;
		align-items: center;
		padding-block: 0.3rem 0.5rem;
		color: var(--text-dim);
		text-decoration: none;
		font-family: var(--pixel);
		font-size: 0.95rem;
		letter-spacing: 0.04em;
		text-shadow: 2px 2px 0 var(--text-shadow-white);
	}

	nav a:hover,
	nav a:focus-visible {
		color: var(--text);
	}

	nav a:focus-visible {
		outline: 2px solid #fff;
		outline-offset: 2px;
	}

	footer {
		margin-top: 5rem;
		padding-block: 2rem;
		background-color: var(--grey-6);
		border-top: 2px solid var(--off-black);
		box-shadow: inset 0 2px 0 0 rgb(0 0 0 / 0.45);
		font-size: 0.8rem;
		color: var(--text-dim);
	}

	footer p + p {
		margin-top: 0.5rem;
	}

	.copyright {
		margin-top: 1.25rem !important;
		padding-top: 1rem;
		border-top: 2px solid var(--grey-5);
	}
</style>
