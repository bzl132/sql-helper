package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.io.Serializable;

/**
 * OA信息
 */
@Data
public class OaMG implements Serializable {
    /**
     * OA链接
     */
    private String OALink;

    /**
     * OA编码
     */
    private String OACode;

    /**
     * OA标题
     */
    private String OAName;

}
