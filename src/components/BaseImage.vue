<template>
    <v-img v-bind="$attrs">
        <template #placeholder>
            <v-skeleton-loader type="image"></v-skeleton-loader>
        </template>
    </v-img>
</template>

<script>
export default {
    name: "BaseImage",
};
</script>
