import "vuetify/styles";
import { createVuetify } from "vuetify";
import { VNumberInput } from "vuetify/labs/VNumberInput";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import { aliases, mdi } from "vuetify/iconsets/mdi";

export default createVuetify({
    components: {
        ...components,
        VNumberInput, // 加入這裡
    },
    directives,
    icons: {
        defaultSet: "mdi",
        aliases,
        sets: { mdi },
    },
    theme: {
        defaultTheme: "light",
    },
});
