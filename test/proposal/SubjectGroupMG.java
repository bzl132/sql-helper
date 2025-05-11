package com.aliyun.fsi.insurance.biz.proposal.iquery.process.mongodb.proposal;

import lombok.Data;

import java.io.Serializable;

/**
 * 标的组
 *
 * @author heliming
 * @date 2022/08/09
 */
@Data
public class SubjectGroupMG implements Serializable {
    private static final long serialVersionUID = 3164053637107767946L;

    /**
     * 分组序号
     */
    private Integer sequenceNo;
    /**
     * 标的编码
     */
    private String subjectSmallCategoryCode;

}
