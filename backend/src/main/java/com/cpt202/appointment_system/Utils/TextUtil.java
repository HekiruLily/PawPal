package com.cpt202.appointment_system.Utils;

import java.text.Normalizer;
import java.util.Locale;

public final class TextUtil {
    private TextUtil() {}
    public static String search(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value.toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").replace('đ', 'd').trim();
    }
}
