<script lang="ts">
	import { v4 as uuidV4 } from "uuid"
	import TodoComponent from "./Todo.svelte";
	import CreationModal from "./CreationModal.svelte";
	
	import type Todo from "./models/Todo";
	import todoList from "./mocks/todos";

	export let todos = todoList;
	export let isModalOpen = false;
	
	export const updateTodo = (todo: Todo) => {
		todos = todos.map(e => {
			if (e.id === todo.id) {
				return todo;
			}
		});
	}

	export const removeTodo = (todo: Todo) => {
		todos = todos.filter(e => e.id !== todo.id);
	}

	export const createTodo = (payload: { title: string, content: string }) => {
		todos.push({
			id: uuidV4(),
			checked: false,
			...payload
		});
	}
</script>

<div class="pb-10">
	<h1 class="py-5 text-4xl font-bold">Todo list example with Svelte</h1>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>

	<h2 class="py-5 text-2xl font-semibold italic text-blue-400">TODO's:</h2>
	<CreationModal 
		isOpen={isModalOpen} 
		onClose={() => { isModalOpen = !isModalOpen; }} 
		onAccept={(payload) => { createTodo(payload); isModalOpen = !isModalOpen;}} 
	/>
	<div class="w-full py-5 flex flex-row flex-wrap gap-5 justify-center">
		{#each todos as item}
			<TodoComponent bind:item={item} removeTodo={() => removeTodo(item)} />
		{/each}
		<button 
			class="w-full sm:3/5 md:w-2/5 xl:w-1/4 border-none bg-blue-100 text-white text-[5em] text-bold shadow-md" 
			on:click={() => { isModalOpen = !isModalOpen; }}
		>+</button>
	</div>
</div>

<style lang="postcss" global>
	@tailwind base;
	@tailwind components;
	@tailwind utilities;
</style>