<script lang="ts">
    import type Todo from "./models/Todo";
    
    export let item: Todo;
    export let removeTodo: Function;

    export let isEditionMode = false;
</script>

<div class="w-full sm:3/5 md:w-2/5 xl:w-1/4 p-5 bg-neutral-200 rounded-lg shadow-md">
    <div class="flex flex-row justify-between">
        <input class="px-1 text-lg font-semibold self-center border-none disabled:text-black disabled:bg-inherit" bind:value={item.title} disabled={!isEditionMode} />
        <input class="h-6 w-6 self-center bg-slate-50 accent-green-500" bind:checked={item.checked} type="checkbox" />
    </div>
    <textarea class="w-full my-3 p-1 rounded-sm border-none text-sm disabled:text-black disabled:bg-inherit" bind:value={item.content} disabled={!isEditionMode}/>
    <button class="px-3 py-1 border-2 border-red-600 text-sm text-white font-semibold rounded-md bg-red-600 hover:bg-inherit hover:text-red-600 disabled:hidden" on:click={() => removeTodo(item)} disabled={isEditionMode}>Delete</button>
    <button 
        class={`px-3 py-1 border-2 border-cyan-600 text-sm text-white font-semibold rounded-md bg-cyan-600 hover:bg-inherit hover:text-cyan-600`} 
        on:click={() => { isEditionMode = !isEditionMode;}}
    >{
        isEditionMode ? "cancel" : "Update"
    }</button>
    <button 
        class="px-3 py-1 border-2 border-cyan-600 text-sm text-white font-semibold rounded-md bg-green-600 hover:bg-inherit hover:text-green-600 disabled:hidden" 
        disabled={!isEditionMode}
        on:click={() => { isEditionMode = !isEditionMode;}}
    >Save</button>
</div>