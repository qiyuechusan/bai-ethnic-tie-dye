package com.baizu.tiedye.rag.service;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

/**
 * 中文领域的查询扩展：把用户口语映射到语料用词，并抽取领域词与 bigram。
 * 这样即使没有真实的语义向量，离线关键词检索也能有可用的召回率。
 */
@Component
public class QueryAliasExpander {

    private static final List<List<String>> ALIAS_GROUPS = List.of(
            List.of("扎染", "绞缬", "绞缬染", "扎花"),
            List.of("蜡染", "蜡缬", "蜡画"),
            List.of("蓝印花布", "灰缬", "刮浆染"),
            List.of("夹染", "夹缬", "夹板染"),
            List.of("蓝靛", "板蓝根", "板兰根", "靛蓝", "蓝草"),
            List.of("氧化", "显色", "变蓝", "发色"),
            List.of("周城", "大理", "喜洲", "巍山"),
            List.of("蝴蝶", "蝶纹", "蝶翼"),
            List.of("洱海", "水波", "波浪", "波纹"),
            List.of("太阳", "星芒", "放射"),
            List.of("八角", "八瓣", "几何"),
            List.of("圆点", "豆结", "星空", "雨点"),
            List.of("风琴", "折叠", "条纹"),
            List.of("螺旋", "漩涡", "盘旋"),
            List.of("棉布", "棉"),
            List.of("麻布", "亚麻", "麻"),
            List.of("丝绸", "蚕丝", "丝"),
            List.of("非遗", "非物质文化遗产", "国家级"),
            List.of("传承人", "代表性传承人", "匠人"),
            List.of("防染", "防染剂", "挡染"),
            List.of("针距", "缝距", "针脚"),
            List.of("冰纹", "冰裂纹", "蜡裂"),
            List.of("浸染", "染色", "入染"),
            List.of("脱浆", "退浆", "去浆"),
            List.of("固色", "媒染", "牢度"));

    private static final List<String> DOMAIN_TERMS = List.of(
            "扎结", "捆扎", "缝扎", "缚扎", "撮扎", "夹扎", "谷粒", "扎花", "扎结点",
            "完全防染", "半防染", "晕染", "留白", "白花", "蓝白",
            "隐色体", "还原", "染色", "浸染", "氧化", "显色", "色深", "色浅",
            "棉", "麻", "丝", "纤维素", "蛋白质", "吸染", "上染", "渗透",
            "纹样", "寓意", "对称", "镜像", "旋转", "二方连续", "构图",
            "蝴蝶", "鱼", "莲花", "梅花", "八角花", "太阳纹", "铜钱纹", "回纹",
            "洱海", "水波", "波浪", "几何", "方格", "冰裂",
            "周城", "喜洲", "巍山", "大理", "苍山", "洱海", "璞真", "严家大院",
            "传承人", "段银开", "张仕绅", "张翰敏", "非遗", "国家级", "项目编号",
            "工序", "设计图稿", "印花", "打样", "脱浆", "脱水", "清洗", "固色", "拆线",
            "蜂蜡", "针距", "凿洞", "蓝靛", "板蓝根", "土靛", "染缸", "九浸九晒",
            "蜡缬", "夹缬", "灰缬", "绞缬", "蓝印花布", "冰纹", "花版", "防染浆",
            "植物染", "化学染", "合成靛蓝", "固色", "成本", "色牢度");

    public QueryTerms analyze(String query) {
        String normalized = normalize(query);
        Set<String> terms = new LinkedHashSet<>();
        Set<String> aliases = new LinkedHashSet<>();

        for (List<String> group : ALIAS_GROUPS) {
            boolean hit = group.stream().anyMatch(normalized::contains);
            if (hit) {
                for (String alias : group) {
                    aliases.add(alias);
                    terms.add(alias);
                }
            }
        }
        for (String term : DOMAIN_TERMS) {
            if (normalized.contains(term)) {
                terms.add(term);
            }
        }
        for (String bigram : bigrams(normalized)) {
            if (terms.size() >= 24) {
                break;
            }
            terms.add(bigram);
        }
        if (terms.isEmpty() && !normalized.isBlank()) {
            terms.add(normalized.length() > 12 ? normalized.substring(0, 12) : normalized);
        }
        return new QueryTerms(normalized, List.copyOf(terms), List.copyOf(aliases));
    }

    public String expandText(String query) {
        QueryTerms terms = analyze(query);
        StringBuilder builder = new StringBuilder(query == null ? "" : query);
        for (String alias : terms.aliases()) {
            builder.append(' ').append(alias);
        }
        return builder.toString();
    }

    public static String normalize(String value) {
        if (value == null) {
            return "";
        }
        String nfkc = Normalizer.normalize(value, Normalizer.Form.NFKC).toLowerCase();
        StringBuilder builder = new StringBuilder(nfkc.length());
        for (int i = 0; i < nfkc.length(); i++) {
            char ch = nfkc.charAt(i);
            if (Character.isLetterOrDigit(ch)) {
                builder.append(ch);
            }
        }
        return builder.toString();
    }

    private static List<String> bigrams(String text) {
        List<String> result = new ArrayList<>();
        for (int i = 0; i + 1 < text.length(); i++) {
            char first = text.charAt(i);
            char second = text.charAt(i + 1);
            if (Character.UnicodeScript.of(first) == Character.UnicodeScript.HAN
                    && Character.UnicodeScript.of(second) == Character.UnicodeScript.HAN) {
                result.add(text.substring(i, i + 2));
            }
        }
        return result;
    }

    public record QueryTerms(String normalized, List<String> terms, List<String> aliases) {
    }
}
